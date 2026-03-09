<?php

namespace App\Form;

use App\Entity\Rangement;
use App\Entity\TypeRangement;
use App\Entity\Zone;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Doctrine\ORM\EntityManagerInterface;

class RangementType extends AbstractType
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('nom')
            ->add('type', EntityType::class, [
                'class' => TypeRangement::class,
                'choice_label' => 'nom',
                'placeholder' => 'Sélectionner un type',
                'required' => false,
            ])
            ->add('zone', EntityType::class, [
                'class' => Zone::class,
                'choice_label' => 'nom',
            ])
        ;

        $builder->addEventListener(FormEvents::PRE_SET_DATA, function (FormEvent $event) {
            $form = $event->getForm();
            $data = $event->getData();

            // Ajouter l'option de créer un nouveau type
            $form->add('createNewType', CheckboxType::class, [
                'mapped' => false,
                'required' => false,
                'label' => 'Créer un nouveau type de rangement',
            ]);

            // Ajouter le champ pour saisir le nom du nouveau type
            $form->add('newTypeName', TextType::class, [
                'mapped' => false,
                'required' => false,
                'label' => 'Nouveau type de rangement',
            ]);
        });
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Rangement::class,
        ]);
    }
}
