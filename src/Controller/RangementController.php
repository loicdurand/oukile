<?php

namespace App\Controller;

use App\Entity\Rangement;
use App\Form\RangementType;
use App\Repository\RangementRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/rangement')]
final class RangementController extends AbstractController
{
    #[Route(name: 'oukile_rangement_index', methods: ['GET'])]
    public function index(RangementRepository $rangementRepository): Response
    {
        return $this->render('rangement/index.html.twig', [
            'rangements' => $rangementRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'oukile_rangement_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $rangement = new Rangement();
        $form = $this->createForm(RangementType::class, $rangement);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($rangement);
            $entityManager->flush();

            return $this->redirectToRoute('oukile_rangement_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('rangement/new.html.twig', [
            'rangement' => $rangement,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'oukile_rangement_show', methods: ['GET'])]
    public function show(Rangement $rangement): Response
    {
        return $this->render('rangement/show.html.twig', [
            'rangement' => $rangement,
        ]);
    }

    #[Route('/{id}/edit', name: 'oukile_rangement_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, Rangement $rangement, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(RangementType::class, $rangement);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('oukile_rangement_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('rangement/edit.html.twig', [
            'rangement' => $rangement,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'oukile_rangement_delete', methods: ['POST'])]
    public function delete(Request $request, Rangement $rangement, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete' . $rangement->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($rangement);
            $entityManager->flush();
        }

        return $this->redirectToRoute('oukile_rangement_index', [], Response::HTTP_SEE_OTHER);
    }
}
