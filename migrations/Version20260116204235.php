<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260116204235 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE article (id INT AUTO_INCREMENT NOT NULL, code_solaris VARCHAR(20) DEFAULT NULL, numero_serie VARCHAR(20) DEFAULT NULL, famille_id INT NOT NULL, INDEX IDX_23A0E6697A77B84 (famille_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE categorie (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(20) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE emplacement (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(20) NOT NULL, rangement_id INT NOT NULL, INDEX IDX_C0CF65F6A4DEB784 (rangement_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE famille_article (id INT AUTO_INCREMENT NOT NULL, marque VARCHAR(20) DEFAULT NULL, modele VARCHAR(20) DEFAULT NULL, description VARCHAR(255) DEFAULT NULL, categorie_id INT NOT NULL, INDEX IDX_CE500488BCF5E72D (categorie_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE lot (id INT AUTO_INCREMENT NOT NULL, nombre INT DEFAULT NULL, famille_id INT NOT NULL, emplacement_id INT NOT NULL, INDEX IDX_B81291B97A77B84 (famille_id), INDEX IDX_B81291BC4598A51 (emplacement_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE piece (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, unite_id INT NOT NULL, INDEX IDX_44CA0B23EC4A74AB (unite_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE rangement (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, zone_id INT NOT NULL, type_id INT DEFAULT NULL, INDEX IDX_90F17AA69F2C3FAB (zone_id), INDEX IDX_90F17AA6C54C8C93 (type_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE type_rangement (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(20) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE unite (id INT AUTO_INCREMENT NOT NULL, code VARCHAR(8) NOT NULL, nom VARCHAR(255) NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE zone (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, piece_id INT NOT NULL, INDEX IDX_A0EBC007C40FCFA8 (piece_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E6697A77B84 FOREIGN KEY (famille_id) REFERENCES famille_article (id)');
        $this->addSql('ALTER TABLE emplacement ADD CONSTRAINT FK_C0CF65F6A4DEB784 FOREIGN KEY (rangement_id) REFERENCES rangement (id)');
        $this->addSql('ALTER TABLE famille_article ADD CONSTRAINT FK_CE500488BCF5E72D FOREIGN KEY (categorie_id) REFERENCES categorie (id)');
        $this->addSql('ALTER TABLE lot ADD CONSTRAINT FK_B81291B97A77B84 FOREIGN KEY (famille_id) REFERENCES famille_article (id)');
        $this->addSql('ALTER TABLE lot ADD CONSTRAINT FK_B81291BC4598A51 FOREIGN KEY (emplacement_id) REFERENCES emplacement (id)');
        $this->addSql('ALTER TABLE piece ADD CONSTRAINT FK_44CA0B23EC4A74AB FOREIGN KEY (unite_id) REFERENCES unite (id)');
        $this->addSql('ALTER TABLE rangement ADD CONSTRAINT FK_90F17AA69F2C3FAB FOREIGN KEY (zone_id) REFERENCES zone (id)');
        $this->addSql('ALTER TABLE rangement ADD CONSTRAINT FK_90F17AA6C54C8C93 FOREIGN KEY (type_id) REFERENCES type_rangement (id)');
        $this->addSql('ALTER TABLE zone ADD CONSTRAINT FK_A0EBC007C40FCFA8 FOREIGN KEY (piece_id) REFERENCES piece (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE article DROP FOREIGN KEY FK_23A0E6697A77B84');
        $this->addSql('ALTER TABLE emplacement DROP FOREIGN KEY FK_C0CF65F6A4DEB784');
        $this->addSql('ALTER TABLE famille_article DROP FOREIGN KEY FK_CE500488BCF5E72D');
        $this->addSql('ALTER TABLE lot DROP FOREIGN KEY FK_B81291B97A77B84');
        $this->addSql('ALTER TABLE lot DROP FOREIGN KEY FK_B81291BC4598A51');
        $this->addSql('ALTER TABLE piece DROP FOREIGN KEY FK_44CA0B23EC4A74AB');
        $this->addSql('ALTER TABLE rangement DROP FOREIGN KEY FK_90F17AA69F2C3FAB');
        $this->addSql('ALTER TABLE rangement DROP FOREIGN KEY FK_90F17AA6C54C8C93');
        $this->addSql('ALTER TABLE zone DROP FOREIGN KEY FK_A0EBC007C40FCFA8');
        $this->addSql('DROP TABLE article');
        $this->addSql('DROP TABLE categorie');
        $this->addSql('DROP TABLE emplacement');
        $this->addSql('DROP TABLE famille_article');
        $this->addSql('DROP TABLE lot');
        $this->addSql('DROP TABLE piece');
        $this->addSql('DROP TABLE rangement');
        $this->addSql('DROP TABLE type_rangement');
        $this->addSql('DROP TABLE unite');
        $this->addSql('DROP TABLE zone');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
