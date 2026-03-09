<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class QuickStockController extends AbstractController
{
    #[Route("/", name: "oukile_stock")]
    public function index(#[CurrentUser] ?User $user): Response
    {
        if (is_null($user)) {
            return $this->redirectToRoute("oukile_login");
        }

        return $this->render("stock/index.html.twig", ["user" => $user]);
    }
}
