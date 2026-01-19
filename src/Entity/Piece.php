<?php

namespace App\Entity;

use App\Repository\PieceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PieceRepository::class), ApiResource(
    normalizationContext: ['groups' => ['piece:read']],
    denormalizationContext: ['groups' => ['piece:write']]
)]
class Piece
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['piece:read', 'piece:write', 'zone:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'pieces')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['piece:read', 'piece:write', 'zone:read'])]
    private ?Unite $unite = null;

    #[ORM\Column(length: 255)]
    #[Groups(['piece:read', 'piece:write', 'zone:read'])]
    private ?string $nom = null;

    /**
     * @var Collection<int, Zone>
     */
    #[ORM\OneToMany(targetEntity: Zone::class, mappedBy: 'piece', orphanRemoval: true)]
    #[Groups(['piece:read', 'piece:write'])]
    private Collection $zones;

    public function __construct()
    {
        $this->zones = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUnite(): ?Unite
    {
        return $this->unite;
    }

    public function setUnite(?Unite $unite): static
    {
        $this->unite = $unite;

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
     * @return Collection<int, Zone>
     */
    public function getZones(): Collection
    {
        return $this->zones;
    }

    public function addZone(Zone $zone): static
    {
        if (!$this->zones->contains($zone)) {
            $this->zones->add($zone);
            $zone->setPiece($this);
        }

        return $this;
    }

    public function removeZone(Zone $zone): static
    {
        if ($this->zones->removeElement($zone)) {
            // set the owning side to null (unless already changed)
            if ($zone->getPiece() === $this) {
                $zone->setPiece(null);
            }
        }

        return $this;
    }
}
