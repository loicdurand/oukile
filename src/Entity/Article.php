<?php

namespace App\Entity;

use App\Repository\ArticleRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ArticleRepository::class)]
class Article
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $code_solaris = null;

    #[ORM\Column(length: 20, nullable: true)]
    private ?string $numero_serie = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?FamilleArticle $famille = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCodeSolaris(): ?string
    {
        return $this->code_solaris;
    }

    public function setCodeSolaris(?string $code_solaris): static
    {
        $this->code_solaris = $code_solaris;

        return $this;
    }

    public function getNumeroSerie(): ?string
    {
        return $this->numero_serie;
    }

    public function setNumeroSerie(?string $numero_serie): static
    {
        $this->numero_serie = $numero_serie;

        return $this;
    }

    public function getFamille(): ?FamilleArticle
    {
        return $this->famille;
    }

    public function setFamille(?FamilleArticle $famille): static
    {
        $this->famille = $famille;

        return $this;
    }
}
