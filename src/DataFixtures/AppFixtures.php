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
    }
}
