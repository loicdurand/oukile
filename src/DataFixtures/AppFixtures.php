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
        $etagere = new TypeRangement();
        $etagere->setNom('étagère');
        $manager->persist($etagere);

        $ecran = new Categorie();
        $ecran->setNom('Écran');
        $manager->persist($ecran);

        $familles = [
            'acer_22' => [
                'categorie' => $ecran,
                'marque' => 'Acer',
                'description' => 'Écran Acer 22" pied rotatif'
            ],
            'dell_24' => [
                'categorie' => $ecran,
                'marque' => 'Dell',
                'description' => 'Écran Dell 24" pied fixe'
            ]
        ];

        $unites = [
            [
                'nom' => 'DSOLC Baie-Mahault',
                'code' => '00086977',
                'pieces' => [
                    [
                        'nom' => 'BTI',
                        'zones' => [
                            [
                                'nom' => 'Zone étagères',
                                'rangements' => [
                                    [
                                        'type' => $etagere,
                                        'nom' => 'Étagère A',
                                        'emplacements' => [
                                            [
                                                'nom' => 'A10',
                                                'lots' => [
                                                    [
                                                        'nombre' => 8,
                                                        'famille' => $familles['acer_22']
                                                    ],
                                                    [
                                                        'nombre' => 2,
                                                        'famille' => $familles['dell_24']
                                                    ]
                                                ]
                                            ],
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
                                        'type' => $etagere,
                                        'nom' => 'Étagère B',
                                        'emplacements' => [
                                            ['nom' => 'B10'],
                                            ['nom' => 'B11'],
                                            ['nom' => 'B12']
                                        ]
                                    ],
                                    [
                                        'type' => $etagere,
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
                        'nom' => 'Atelier'
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
                                                $lot->setFamilleArticle($famille);
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
    }
}
