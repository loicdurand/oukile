<?php

namespace App\Entity;

use App\Repository\ZoneRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ZoneRepository::class), ApiResource(
    normalizationContext: ['groups' => ['zone:read']],
    denormalizationContext: ['groups' => ['zone:write']]
)]
class Zone
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['zone:read', 'zone:write', 'piece:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'zones')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['zone:read', 'zone:write'])]
    private ?Piece $piece = null;

    #[ORM\Column(length: 255)]
    #[Groups(['zone:read', 'zone:write', 'piece:read'])]
    private ?string $nom = null;

    /**
     * @var Collection<int, Rangement>
     */
    #[ORM\OneToMany(targetEntity: Rangement::class, mappedBy: 'zone', orphanRemoval: true)]
    #[Groups(['zone:read', 'zone:write', 'piece:read'])]
    private Collection $rangements;

    public function __construct()
    {
        $this->rangements = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPiece(): ?Piece
    {
        return $this->piece;
    }

    public function setPiece(?Piece $piece): static
    {
        $this->piece = $piece;

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
     * @return Collection<int, Rangement>
     */
    public function getRangements(): Collection
    {
        return $this->rangements;
    }

    public function addRangement(Rangement $rangement): static
    {
        if (!$this->rangements->contains($rangement)) {
            $this->rangements->add($rangement);
            $rangement->setZone($this);
        }

        return $this;
    }

    public function removeRangement(Rangement $rangement): static
    {
        if ($this->rangements->removeElement($rangement)) {
            // set the owning side to null (unless already changed)
            if ($rangement->getZone() === $this) {
                $rangement->setZone(null);
            }
        }

        return $this;
    }
}
