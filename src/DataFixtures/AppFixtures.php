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

        $handle = fopen(__DIR__ . "/materiel-solaris.csv", "r");
        $header = fgetcsv($handle);

        // 1. On pré-charge les catégories pour le mapping
        $categories = [];
        foreach ($manager->getRepository(Categorie::class)->findAll() as $cat) {
            $categories[$cat->getNom()] = $cat;
        }

        // 2. On pré-charge les Familles existantes (Clé = Marque:Modele)
        // Cela permet d'éviter les doublons dès le départ
        $famillesExistantes = [];
        foreach ($manager->getRepository(FamilleArticle::class)->findAll() as $f) {
            $key = strtolower($f->getMarque() . ':' . $f->getModele());
            $famillesExistantes[$key] = $f;
        }

        $i = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $line = array_combine($header, $row);

            $nomCat = $line["Familles"];
            $marque = $line["Marque"];
            $modele = $line["Modele"];
            $key = strtolower($marque . ':' . $modele);

            // Gestion de la catégorie (Auto-création si absente)
            if (!isset($categories[$nomCat])) {
                $categorie = new Categorie();
                $categorie->setNom($nomCat);
                $manager->persist($categorie);
                $categories[$nomCat] = $categorie;
                $manager->flush(); // Flush immédiat pour l'ID
            }

            // 3. LOGIQUE UPSERT : On ne crée que si la clé n'existe pas dans notre index
            if (!isset($famillesExistantes[$key])) {
                $famille = new FamilleArticle();
                $famille->setMarque($marque);
                $famille->setModele($modele);
                $famille->setCategorie($categories[$nomCat]);

                $manager->persist($famille);

                // On l'ajoute à l'index pour que la ligne suivante (si doublon) ne la recrée pas
                $famillesExistantes[$key] = $famille;
            } else {
                // Optionnel : Mettre à jour la catégorie si elle a changé dans le CSV
                $famillesExistantes[$key]->setCategorie($categories[$nomCat]);
            }

            // Batch processing
            if (($i % 100) === 0) {
                $manager->flush();
                // Note: On ne fait pas clear() ici car on veut garder nos index $categories 
                // et $famillesExistantes actifs (objets managés).
            }
            $i++;
        }

        $manager->flush();
        $manager->clear();
        fclose($handle);
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
