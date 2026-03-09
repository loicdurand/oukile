<?php

namespace App\Entity;

use App\Repository\UniteRepository;
use BcMath\Number;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: UniteRepository::class), ApiResource(
    normalizationContext: ['groups' => ['unite:read']],
    denormalizationContext: ['groups' => ['unite:write']]
)]
class Unite
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['unite:read', 'unite:write', 'piece:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 8)]
    #[Groups(['unite:read', 'unite:write', 'piece:read'])]
    private ?string $code = null;

    #[ORM\Column(length: 255)]
    #[Groups(['unite:read', 'unite:write', 'piece:read'])]
    private ?string $nom = null;

    /**
     * @var Collection<int, Piece>
     */
    #[ORM\OneToMany(targetEntity: Piece::class, mappedBy: 'unite', orphanRemoval: true)]
    #[Groups(['unite:read', 'unite:write'])]
    private Collection $pieces;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['unite:read', 'unite:write'])]
    private ?string $mail = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['unite:read', 'unite:write'])]
    private ?int $departement = null;

    public function __construct()
    {
        $this->pieces = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = $code;

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
     * @return Collection<int, Piece>
     */
    public function getPieces(): Collection
    {
        return $this->pieces;
    }

    public function addPiece(Piece $piece): static
    {
        if (!$this->pieces->contains($piece)) {
            $this->pieces->add($piece);
            $piece->setUnite($this);
        }

        return $this;
    }

    public function removePiece(Piece $piece): static
    {
        if ($this->pieces->removeElement($piece)) {
            // set the owning side to null (unless already changed)
            if ($piece->getUnite() === $this) {
                $piece->setUnite(null);
            }
        }

        return $this;
    }

    public function getMail(): ?string
    {
        return $this->mail;
    }

    public function setMail(?string $mail): static
    {
        $this->mail = $mail;

        return $this;
    }

    public function getDepartement(): ?int
    {
        return $this->departement;
    }

    public function setDepartement(?int $departement): static
    {
        $this->departement = $departement;

        return $this;
    }
}
