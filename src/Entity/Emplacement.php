<?php

namespace App\Entity;

use App\Repository\EmplacementRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EmplacementRepository::class)]
class Emplacement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20)]
    private ?string $nom = null;

    #[ORM\ManyToOne(inversedBy: 'emplacements')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Rangement $rangement = null;

    /**
     * @var Collection<int, Lot>
     */
    #[ORM\OneToMany(targetEntity: Lot::class, mappedBy: 'emplacement', orphanRemoval: true)]
    private Collection $lots;

    public function __construct()
    {
        $this->lots = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getRangement(): ?Rangement
    {
        return $this->rangement;
    }

    public function setRangement(?Rangement $rangement): static
    {
        $this->rangement = $rangement;

        return $this;
    }

    /**
     * @return Collection<int, Lot>
     */
    public function getLots(): Collection
    {
        return $this->lots;
    }

    public function addLot(Lot $lot): static
    {
        if (!$this->lots->contains($lot)) {
            $this->lots->add($lot);
            $lot->setEmplacement($this);
        }

        return $this;
    }

    public function removeLot(Lot $lot): static
    {
        if ($this->lots->removeElement($lot)) {
            // set the owning side to null (unless already changed)
            if ($lot->getEmplacement() === $this) {
                $lot->setEmplacement(null);
            }
        }

        return $this;
    }
}
