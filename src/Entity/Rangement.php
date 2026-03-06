<?php

namespace App\Entity;

use App\Repository\RangementRepository;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: RangementRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['rangement:read']],
    denormalizationContext: ['groups' => ['rangement:write']]
)]
#[ApiFilter(SearchFilter::class, properties: ['zone.piece.unite.id' => 'exact'])]
class Rangement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['rangement:read', 'rangement:write', 'zone:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'rangements')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['rangement:read', 'rangement:write'])]
    private ?Zone $zone = null;

    #[ORM\ManyToOne]
    #[Groups(['rangement:read', 'rangement:write'])]
    private ?TypeRangement $type = null;

    #[ORM\Column(length: 255)]
    #[Groups(['rangement:read', 'rangement:write', 'zone:read'])]
    private ?string $nom = null;

    /**
     * @var Collection<int, Emplacement>
     */
    #[ORM\OneToMany(targetEntity: Emplacement::class, mappedBy: 'rangement', orphanRemoval: true)]
    #[Groups(['rangement:read', 'rangement:write'])]
    private Collection $emplacements;

    public function __construct()
    {
        $this->emplacements = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getZone(): ?Zone
    {
        return $this->zone;
    }

    public function getType(): ?TypeRangement
    {
        return $this->type;
    }

    public function setType(?TypeRangement $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function setZone(?Zone $zone): static
    {
        $this->zone = $zone;

        return $this;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    /**
     * @return Collection<int, Emplacement>
     */
    public function getEmplacements(): Collection
    {
        return $this->emplacements;
    }

    public function addEmplacement(Emplacement $emplacement): static
    {
        if (!$this->emplacements->contains($emplacement)) {
            $this->emplacements->add($emplacement);
            $emplacement->setRangement($this);
        }

        return $this;
    }

    public function removeEmplacement(Emplacement $emplacement): static
    {
        if ($this->emplacements->removeElement($emplacement)) {
            // set the owning side to null (unless already changed)
            if ($emplacement->getRangement() === $this) {
                $emplacement->setRangement(null);
            }
        }

        return $this;
    }
}
