<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;
use App\Entity\Election;
use App\Entity\Candidat;
use App\Entity\Vote;
use App\Entity\Registre;

final class IndexController extends AbstractController
{

    #[Route('/', name: 'oukile_index')]
    public function index(#[CurrentUser] ?User $user, EntityManagerInterface $entityManager): Response
    {

        if (is_null($user))
            return $this->redirectToRoute('oukile_login');

        return $this->render('index/index.html.twig', []);
    }
}
