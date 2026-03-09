<?php

namespace App\Controller;

use App\Entity\TypeRangement;
use App\Form\TypeRangementType;
use App\Repository\TypeRangementRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/type/rangement')]
final class TypeRangementController extends AbstractController
{
    #[Route(name: 'app_type_rangement_index', methods: ['GET'])]
    public function index(TypeRangementRepository $typeRangementRepository): Response
    {
        return $this->render('type_rangement/index.html.twig', [
            'type_rangements' => $typeRangementRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'app_type_rangement_new', methods: ['GET', 'POST'])]
    public function new(Request $request, EntityManagerInterface $entityManager): Response
    {
        $typeRangement = new TypeRangement();
        $form = $this->createForm(TypeRangementType::class, $typeRangement);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($typeRangement);
            $entityManager->flush();

            return $this->redirectToRoute('app_type_rangement_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('type_rangement/new.html.twig', [
            'type_rangement' => $typeRangement,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_type_rangement_show', methods: ['GET'])]
    public function show(TypeRangement $typeRangement): Response
    {
        return $this->render('type_rangement/show.html.twig', [
            'type_rangement' => $typeRangement,
        ]);
    }

    #[Route('/{id}/edit', name: 'app_type_rangement_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, TypeRangement $typeRangement, EntityManagerInterface $entityManager): Response
    {
        $form = $this->createForm(TypeRangementType::class, $typeRangement);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('app_type_rangement_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('type_rangement/edit.html.twig', [
            'type_rangement' => $typeRangement,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'app_type_rangement_delete', methods: ['POST'])]
    public function delete(Request $request, TypeRangement $typeRangement, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete'.$typeRangement->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($typeRangement);
            $entityManager->flush();
        }

        return $this->redirectToRoute('app_type_rangement_index', [], Response::HTTP_SEE_OTHER);
    }
}
