<?php

namespace App\Controller;

use App\Entity\FamilleArticle;
use App\Form\FamilleArticleType;
use App\Repository\FamilleArticleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/famille/article')]
final class FamilleArticleController extends AbstractController
{
    #[Route(name: 'app_famille_article_index', methods: ['GET'])]
    public function index(FamilleArticleRepository $familleArticleRepository): Response
    {
        return $this->render('famille_article/index.html.twig', [
            'famille_articles' => $familleArticleRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_famille_article_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $familleArticle = new FamilleArticle();
        $form = $this->createForm(FamilleArticleType::class, $familleArticle);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($familleArticle);
            $entityManager->flush();

            return $this->redirectToRoute('app_famille_article_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('famille_article/new.html.twig', [
            'famille_article' => $familleArticle,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_famille_article_show', methods: ['GET'])]
    public function show(FamilleArticle $familleArticle): Response
    {
        return $this->render('famille_article/show.html.twig', [
            'famille_article' => $familleArticle,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_famille_article_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, FamilleArticle $familleArticle, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(FamilleArticleType::class, $familleArticle);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_famille_article_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('famille_article/edit.html.twig', [
            'famille_article' => $familleArticle,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_famille_article_delete', methods: ['POST'])]
    public function delete(Request $request, FamilleArticle $familleArticle, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$familleArticle->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($familleArticle);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_famille_article_index', [], Response::HTTP_SEE_OTHER);
    }
}
