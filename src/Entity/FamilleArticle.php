<?php

namespace App\Entity;

use App\Repository\FamilleArticleRepository;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: FamilleArticleRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['familleArticle:read']],
    denormalizationContext: ['groups' => ['familleArticle:write']]
)]
#[ApiFilter(SearchFilter::class, properties: [
    'marque'      => 'partial',
    'modele'      => 'partial',
    'description' => 'partial',
])]
class FamilleArticle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['familleArticle:read', 'familleArticle:write', 'lot:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['familleArticle:read', 'familleArticle:write', 'lot:read'])]
    private ?Categorie $categorie = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['familleArticle:read', 'familleArticle:write', 'lot:read'])]
    private ?string $marque = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['familleArticle:read', 'familleArticle:write', 'lot:read'])]
    private ?string $modele = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['familleArticle:read', 'familleArticle:write', 'lot:read'])]
    private ?string $description = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCategorie(): ?Categorie
    {
        return $this->categorie;
    }

    public function setCategorie(?Categorie $categorie): static
    {
        $this->categorie = $categorie;

        return $this;
    }

    public function getMarque(): ?string
    {
        return $this->marque;
    }

    public function setMarque(?string $marque): static
    {
        $this->marque = $marque;

        return $this;
    }

    public function getModele(): ?string
    {
        return $this->modele;
    }

    public function setModele(?string $modele): static
    {
        $this->modele = $modele;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }
}
