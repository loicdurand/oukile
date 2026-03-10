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

        /**
         * ARCHITECTURE DE L'UNITÉ (PIÈCES, ZONES, RANGEMENTS, ETC...)
         */

        $types_rangements = [];
        $rangements = ['étagère', 'bureau', 'armoire', 'plan de travail', 'table', 'tiroclass'];
        foreach ($rangements as $rangement) {
            $entity = new TypeRangement();
            $entity->setNom($rangement);
            $manager->persist($entity);
            $manager->flush();
            $types_rangements[$rangement] = $entity;
        }

        $meubles_partie_bureau = [];
        $personnels = ['Ch', 'L', 'T', 'B', 'F', 'N'];
        foreach ($personnels as $personnel) {
            $meubles_partie_bureau[] = [
                'type' => $types_rangements['bureau'],
                'nom' => 'Bureau de ' . $personnel,
                'emplacements' => [
                    ['nom' => 'Plan de travail'],
                    ['nom' => 'Tiroir du haut'],
                    ['nom' => 'Tiroir du milieu'],
                    ['nom' => 'Tiroir du bas'],
                ]
            ];
        }
        $meubles_partie_bureau[] = [
            'type' => $types_rangements['armoire'],
            'nom' => 'Armoire basse fournitures',
            'emplacements' => [
                ['nom' => 'Étagère du haut'],
                ['nom' => 'Étagère du milieu'],
                ['nom' => 'Étagères du bas'],
            ]
        ];

        $unites = [
            [
                'nom' => 'UNITÉ Ville',
                'code' => '00088888',
                'pieces' => [
                    [
                        'nom' => 'BTI',
                        'zones' => [
                            [
                                'nom' => 'Zone étagères',
                                'rangements' => [
                                    [
                                        'type' => $types_rangements['étagère'],
                                        'nom' => 'Étagère A',
                                        'emplacements' => [
                                            ['nom' => 'A10'],
                                            ['nom' => 'A11'],
                                            ['nom' => 'A12'],
                                            ['nom' => 'A20'],
                                            ['nom' => 'A21'],
                                            ['nom' => 'A22'],
                                            ['nom' => 'A30'],
                                            ['nom' => 'A31'],
                                            ['nom' => 'A32']
                                        ]
                                    ],
                                    [
                                        'type' => $types_rangements['étagère'],
                                        'nom' => 'Étagère B',
                                        'emplacements' => [
                                            ['nom' => 'B10'],
                                            ['nom' => 'B11'],
                                            ['nom' => 'B12']
                                        ]
                                    ],
                                    [
                                        'type' => $types_rangements['étagère'],
                                        'nom' => 'Étagère C'
                                    ]
                                ]
                            ],
                            'Zone vrac'
                        ]
                    ],
                    [
                        'nom' => 'Garage'
                    ],
                    [
                        'nom' => 'Atelier',
                        'zones' => [
                            [
                                'nom' => 'Partie bureaux',
                                'rangements' => $meubles_partie_bureau
                            ],
                            [
                                'nom' => 'Salle café',
                                'rangements' => [
                                    [
                                        'type' => $types_rangements['bureau'],
                                        'nom' => 'Bureau de Cé',
                                        'emplacements' => [
                                            ['nom' => 'Plan de travail'],
                                            ['nom' => 'Tiroir du haut'],
                                            ['nom' => 'Tiroir du milieu'],
                                            ['nom' => 'Tiroir du bas'],
                                        ]
                                    ],
                                    [
                                        'type' => $types_rangements['armoire'],
                                        'nom' => 'Armoire basse sous TV',
                                        'emplacements' => [
                                            ['nom' => 'Tiroir du haut'],
                                            ['nom' => 'Tiroir du milieu'],
                                            ['nom' => 'Tiroir du bas'],
                                        ]
                                    ],
                                    [
                                        'type' => $types_rangements['armoire'],
                                        'nom' => 'Armoire départs / arrivées',
                                        'emplacements' => [
                                            ['nom' => 'Étagère CGD PAP'],
                                            ['nom' => 'Étagère CGD LE MOULE'],
                                            ['nom' => 'Étagères SCL'],
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ],
                    [
                        'nom' => 'Salle Pinabel'
                    ]
                ]
            ]
        ];

        foreach ($unites as $unite_data) {
            $unite = new Unite();
            $unite->setCode($unite_data['code']);
            $unite->setNom($unite_data['nom']);
            $manager->persist($unite);
            foreach ($unite_data['pieces'] as $piece_data) {
                $piece = new Piece();
                $piece->setNom($piece_data['nom']);
                $piece->setUnite($unite);
                $manager->persist($piece);

                if (isset($piece_data['zones'])) {
                    foreach ($piece_data['zones'] as $zone_data) {
                        $zone = new Zone();
                        $zone->setNom(is_array($zone_data) ? $zone_data['nom'] : $zone_data);
                        $zone->setPiece($piece);
                        $manager->persist($zone);

                        if (is_array($zone_data) && isset($zone_data['rangements'])) {
                            foreach ($zone_data['rangements'] as $rangement_data) {
                                $rangement = new Rangement();
                                $rangement->setNom($rangement_data['nom']);
                                $rangement->setType($rangement_data['type']);
                                $rangement->setZone($zone);
                                $manager->persist($rangement);

                                if (isset($rangement_data['emplacements'])) {
                                    foreach ($rangement_data['emplacements'] as $emplacement_data) {
                                        $emplacement = new Emplacement();
                                        $emplacement->setNom($emplacement_data['nom']);
                                        $emplacement->setRangement($rangement);
                                        $manager->persist($emplacement);

                                        if (isset($emplacement_data['lots'])) {
                                            foreach ($emplacement_data['lots'] as $lot_data) {
                                                $famille_info = $lot_data['famille'];
                                                $famille = new FamilleArticle();
                                                $famille->setCategorie($famille_info['categorie']);
                                                $famille->setMarque($famille_info['marque']);
                                                $famille->setDescription($famille_info['description']);
                                                $manager->persist($famille);

                                                $lot = new Lot();
                                                $lot->setNombre($lot_data['nombre']);
                                                $lot->setFamille($famille);
                                                $lot->setEmplacement($emplacement);
                                                $manager->persist($lot);
                                                $manager->persist($lot);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        $manager->flush();

        /**
         * INSERTION DES MATÉRIELS SOLARIS
         */

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
}
