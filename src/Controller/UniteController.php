<?php

namespace App\Controller;

use App\Entity\Unite;
use App\Form\UniteType;
use App\Repository\UniteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

#[Route('/unite')]
final class UniteController extends AbstractController
{
    #[Route(name: 'oukile_unite_index', methods: ['GET'])]
    public function index(#[CurrentUser] ?User $user, UniteRepository $uniteRepository): Response
    {

        if (is_null($user))
            return $this->redirectToRoute('oukile_login');

        return $this->render('unite/index.html.twig', [
            'user' => $user,
            'unites' => $uniteRepository->findAll(),
        ]);
    }

    #[Route('/new', name: 'oukile_unite_new', methods: ['GET', 'POST'])]
    public function new(#[CurrentUser] ?User $user, Request $request, EntityManagerInterface $entityManager): Response
    {
        if (is_null($user))
            return $this->redirectToRoute('oukile_login');

        $unite = new Unite();
        $form = $this->createForm(UniteType::class, $unite);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $unite->setCode($this->addZeros($unite->getCode(), 8));
            $entityManager->persist($unite);
            $entityManager->flush();

            return $this->redirectToRoute('oukile_unite_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('unite/new.html.twig', [
            'user' => $user,
            'unite' => $unite,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'oukile_unite_show', methods: ['GET'])]
    public function show(#[CurrentUser] ?User $user, Unite $unite): Response
    {
        if (is_null($user))
            return $this->redirectToRoute('oukile_login');

        return $this->render('unite/show.html.twig', [
            'user' => $user,
            'unite' => $unite,
        ]);
    }

    #[Route('/{id}/edit', name: 'oukile_unite_edit', methods: ['GET', 'POST'])]
    public function edit(#[CurrentUser] ?User $user, Request $request, Unite $unite, EntityManagerInterface $entityManager): Response
    {
        if (is_null($user))
            return $this->redirectToRoute('oukile_login');

        $form = $this->createForm(UniteType::class, $unite);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute('oukile_unite_index', [], Response::HTTP_SEE_OTHER);
        }

        return $this->render('unite/edit.html.twig', [
            'user' => $user,
            'unite' => $unite,
            'form' => $form,
        ]);
    }

    #[Route('/{id}', name: 'oukile_unite_delete', methods: ['POST'])]
    public function delete(Request $request, Unite $unite, EntityManagerInterface $entityManager): Response
    {
        if ($this->isCsrfTokenValid('delete' . $unite->getId(), $request->getPayload()->getString('_token'))) {
            $entityManager->remove($unite);
            $entityManager->flush();
        }

        return $this->redirectToRoute('oukile_unite_index', [], Response::HTTP_SEE_OTHER);
    }

    private function addZeros($str, $maxlen = 2)
    {
        $str = '' . $str;
        while (strlen($str) < $maxlen)
            $str = "0" . $str;
        return $str;
    }
}
