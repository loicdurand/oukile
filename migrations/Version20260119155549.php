<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260119155549 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, user_id VARCHAR(8) NOT NULL, grade VARCHAR(50) DEFAULT NULL, roles JSON NOT NULL, titre VARCHAR(255) NOT NULL, specialite VARCHAR(25) DEFAULT NULL, mail VARCHAR(255) NOT NULL, unite_id INT NOT NULL, INDEX IDX_8D93D649EC4A74AB (unite_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649EC4A74AB FOREIGN KEY (unite_id) REFERENCES unite (id)');
        $this->addSql('ALTER TABLE piece CHANGE nom nom VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE unite ADD mail VARCHAR(255) DEFAULT NULL, ADD departement INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user DROP FOREIGN KEY FK_8D93D649EC4A74AB');
        $this->addSql('DROP TABLE user');
        $this->addSql('ALTER TABLE piece CHANGE nom nom VARCHAR(255) NOT NULL COMMENT \'ex: Atelier, BTI, Garage, etc...\'');
        $this->addSql('ALTER TABLE unite DROP mail, DROP departement');
    }
}
