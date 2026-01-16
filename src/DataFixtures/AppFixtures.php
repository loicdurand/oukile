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
use App\Entity\Article;
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
                'code_solaris' => 'ING-JHB-000260001',
                'categorie' => $ecran,
                'marque' => 'Acer',
                'description' => 'Écran Acer 22" pied rotatif'
            ],
            'dell_24' => [
                'code_solaris' => 'ING-JHB-000260002',
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
                                                        'article' => $familles['acer_22']
                                                    ],
                                                    [
                                                        'nombre' => 2,
                                                        'article' => $familles['dell_24']
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
        }

        $manager->flush();
    }
}
