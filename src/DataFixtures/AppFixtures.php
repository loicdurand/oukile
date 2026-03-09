<?php

namespace App\DataFixtures;

use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

use App\Entity\Unite;
use App\Entity\Piece;
use App\Entity\Zone;
use App\Entity\Rangement;
use App\Entity\Emplacement;
use App\Entity\TypeRangement;
use App\Entity\FamilleArticle;
use App\Entity\Lot;
use App\Entity\Categorie;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // $connection = $manager->getConnection();
        // 1. On coupe les logs pour économiser la RAM
        // $connection->getConfiguration()->setSQLLogger(null);

        $filePath = __DIR__ . "/materiel-solaris.csv";
        $handle = fopen($filePath, "r");
        $header = fgetcsv($handle);

        // On charge TOUTES les catégories existantes une seule fois en mémoire
        // (800 lignes, c'est rien pour un tableau PHP indexé)
        $categories = [];
        $existingCats = $manager->getRepository(Categorie::class)->findAll();
        foreach ($existingCats as $cat) {
            $categories[$cat->getNom()] = $cat;
        }

        $i = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $line = array_combine($header, $row);
            $nomCat = $line["Familles"];

            // Si la catégorie n'est pas dans notre index local, on la crée
            if (!isset($categories[$nomCat])) {
                $categorie = new Categorie();
                $categorie->setNom($nomCat);
                $manager->persist($categorie);
                $categories[$nomCat] = $categorie;

                // On flush exceptionnellement pour avoir l'ID en base
                $manager->flush();
            }

            $famille = new FamilleArticle();
            $famille->setMarque($line["Marque"]);
            $famille->setModele($line["Modele"]);
            $famille->setCategorie($categories[$nomCat]);

            $manager->persist($famille);

            // Batch flush plus grand
            if (($i % 100) === 0) {
                $manager->flush();
                $manager->detach($famille); // On détache juste l'objet pour vider la RAM
            }
            $i++;
        }

        $manager->flush();
        $manager->clear();
        fclose($handle);

        $this->fusionnerDoublons($manager);
    }

    public function fusionnerDoublons(ObjectManager $manager): void
    {
        $repoFamille = $manager->getRepository(FamilleArticle::class);
        $repoLot = $manager->getRepository(Lot::class);

        // 1. On récupère les combinaisons Marque/Modele qui apparaissent plus d'une fois
        $doublons = $manager->createQuery(
            'SELECT f.marque, f.modele, COUNT(f.id) as total
         FROM App\Entity\FamilleArticle f
         GROUP BY f.marque, f.modele
         HAVING total > 1'
        )->getResult();

        foreach ($doublons as $groupe) {
            // Récupérer toutes les entités de ce groupe
            $entites = $repoFamille->findBy([
                'marque' => $groupe['marque'],
                'modele' => $groupe['modele']
            ]);

            // Le premier devient le Maître
            $maitre = array_shift($entites);

            foreach ($entites as $esclave) {
                // 2. On récupère les lots rattachés à l'esclave
                $lots = $repoLot->findBy(['famille' => $esclave]);

                foreach ($lots as $lot) {
                    // 3. On réassigne le lot au maître
                    $lot->setFamille($maitre);
                }

                // 4. On supprime l'esclave (Doctrine gérera la suppression en fin de flush)
                $manager->remove($esclave);
            }

            // On flush par groupe pour ne pas saturer la mémoire
            $manager->flush();
            $manager->clear();

            // Note : Après clear(), il faut re-fetch le repo ou les objets si on continue 
            // mais ici on boucle sur le résultat du premier Query, donc c'est OK.
        }
    }
}
