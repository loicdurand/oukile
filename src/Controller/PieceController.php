<?php

namespace App\Controller;

use App\Entity\Piece;
use App\Form\PieceType;
use App\Repository\PieceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Repository\UniteRepository;

#[Route("/piece")]
final class PieceController extends AbstractController
{
    #[Route(name: "oukile_piece_index", methods: ["GET"])]
    public function index(PieceRepository $pieceRepository): Response
    {
        return $this->render("piece/index.html.twig", [
            "pieces" => $pieceRepository->findAll(),
        ]);
    }

    #[Route("/new", name: "oukile_piece_new", methods: ["GET", "POST"])]
    public function new(
        Request $request,
        EntityManagerInterface $entityManager,
        UniteRepository $uniteRepository,
    ): Response {
        $piece = new Piece();
        $uniteId = $request->query->get("id");
        if ($uniteId) {
            $unite = $uniteRepository->find($uniteId);
            if ($unite) {
                $piece->setUnite($unite);
            }
        }
        $form = $this->createForm(PieceType::class, $piece);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->persist($piece);
            $entityManager->flush();

            return $this->redirectToRoute(
                "oukile_unite_show",
                ["id" => $uniteId],
                Response::HTTP_SEE_OTHER,
            );
        }

        return $this->render("piece/new.html.twig", [
            "piece" => $piece,
            "form" => $form,
        ]);
    }

    #[Route("/{id}", name: "oukile_piece_show", methods: ["GET"])]
    public function show(Piece $piece): Response
    {
        return $this->render("piece/show.html.twig", [
            "piece" => $piece,
        ]);
    }

    #[Route("/{id}/edit", name: "oukile_piece_edit", methods: ["GET", "POST"])]
    public function edit(
        Request $request,
        Piece $piece,
        EntityManagerInterface $entityManager,
    ): Response {
        $form = $this->createForm(PieceType::class, $piece);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager->flush();

            return $this->redirectToRoute(
                "oukile_unite_index",
                [],
                Response::HTTP_SEE_OTHER,
            );
        }

        return $this->render("piece/edit.html.twig", [
            "piece" => $piece,
            "form" => $form,
        ]);
    }

    #[Route("/{id}", name: "oukile_piece_delete", methods: ["POST"])]
    public function delete(
        Request $request,
        Piece $piece,
        EntityManagerInterface $entityManager,
    ): Response {
        if (
            $this->isCsrfTokenValid(
                "delete" . $piece->getId(),
                $request->getPayload()->getString("_token"),
            )
        ) {
            $entityManager->remove($piece);
            $entityManager->flush();
        }

        return $this->redirectToRoute(
            "oukile_unite_show",
            [
                "id" => $piece->getUnite()->getId(),
            ],
            Response::HTTP_SEE_OTHER,
        );
    }
}
