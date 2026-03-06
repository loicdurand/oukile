<?php

namespace App\Entity;

use App\Repository\LotRepository;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: LotRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['lot:read']],
    denormalizationContext: ['groups' => ['lot:write']]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'famille.id'                                => 'exact',
    'emplacement.id'                            => 'exact',
    'emplacement.rangement.zone.piece.unite.id' => 'exact',
])]
class Lot
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['lot:read', 'lot:write', 'emplacement:read'])]
    private ?int $id = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['lot:read', 'lot:write', 'emplacement:read'])]
    private ?int $nombre = null;

    #[ORM\ManyToOne(inversedBy: 'lots')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['lot:read', 'lot:write', 'emplacement:read'])]
    private ?FamilleArticle $famille = null;

    #[ORM\ManyToOne(inversedBy: 'lots')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['lot:read', 'lot:write'])]
    private ?Emplacement $emplacement = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombre(): ?int
    {
        return $this->nombre;
    }

    public function setNombre(?int $nombre): static
    {
        $this->nombre = $nombre;

        return $this;
    }

    public function getFamilleArticle(): ?FamilleArticle
    {
        return $this->famille;
    }

    public function setFamilleArticle(?FamilleArticle $famille): static
    {
        $this->famille = $famille;

        return $this;
    }

    public function getEmplacement(): ?Emplacement
    {
        return $this->emplacement;
    }

    public function setEmplacement(?Emplacement $emplacement): static
    {
        $this->emplacement = $emplacement;

        return $this;
    }
}
