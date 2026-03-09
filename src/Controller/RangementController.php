<?php

namespace App\Controller;

use App\Entity\Rangement;
use App\Entity\TypeRangement;
use App\Form\RangementType;
use App\Repository\RangementRepository;
use App\Repository\TypeRangementRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Repository\ZoneRepository;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

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
    public function new(#[CurrentUser] ?User $user, Request $request, EntityManagerInterface $entityManager, ZoneRepository $zoneRepository, TypeRangementRepository $typeRangementRepository): Response
    {

        if (is_null($user))
            return $this->redirectToRoute('oukile_login');

        $rangement = new Rangement();
        $zoneId = $request->query->get('id');
        if ($zoneId) {
            $zone = $zoneRepository->find($zoneId);
            if ($zone) {
                $rangement->setZone($zone);
            }
        }
        $form = $this->createForm(RangementType::class, $rangement);
        $form->handleRequest($request);

        if ($form->isSubmitted()) {
            // Vérifier si un nouveau type a été créé
            $createNewType = $form->get('createNewType')->getData();
            if ($createNewType) {
                $newTypeName = $form->get('newTypeName')->getData();
                if ($newTypeName) {
                    $newType = new TypeRangement();
                    $newType->setNom($newTypeName);
                    $entityManager->persist($newType);
                    $entityManager->flush();
                    $rangement->setType($newType);
                }
            }

            // Valider que si on ne crée pas un nouveau type, le type doit être sélectionné
            if (!$createNewType && !$rangement->getType()) {
                // Le formulaire n'est pas valid, on réaffiche
                return $this->render('rangement/new.html.twig', [
                    'user' => $user,
                    'rangement' => $rangement,
                    'form' => $form,
                ]);
            }

            if ($form->isValid()) {
                $entityManager->persist($rangement);
                $entityManager->flush();

                return $this->redirectToRoute('oukile_unite_index', [], Response::HTTP_SEE_OTHER);
            }
        }

        return $this->render('rangement/new.html.twig', [
            'user' => $user,
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
    public function edit(Request $request, Rangement $rangement, EntityManagerInterface $entityManager, TypeRangementRepository $typeRangementRepository): Response
    {
        $form = $this->createForm(RangementType::class, $rangement);
        $form->handleRequest($request);

        if ($form->isSubmitted()) {
            // Vérifier si un nouveau type a été créé
            $createNewType = $form->get('createNewType')->getData();
            if ($createNewType) {
                $newTypeName = $form->get('newTypeName')->getData();
                if ($newTypeName) {
                    $newType = new TypeRangement();
                    $newType->setNom($newTypeName);
                    $entityManager->persist($newType);
                    $entityManager->flush();
                    $rangement->setType($newType);
                }
            }

            // Valider que si on ne crée pas un nouveau type, le type doit être sélectionné
            if (!$createNewType && !$rangement->getType()) {
                // Le formulaire n'est pas valid, on réaffiche
                return $this->render('rangement/edit.html.twig', [
                    'rangement' => $rangement,
                    'form' => $form,
                ]);
            }

            if ($form->isValid()) {
                $entityManager->flush();

                return $this->redirectToRoute('oukile_unite_index', [], Response::HTTP_SEE_OTHER);
            }
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
