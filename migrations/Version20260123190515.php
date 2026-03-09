<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260123190515 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE piece ADD image_id INT DEFAULT NULL, DROP file_path');
        $this->addSql('ALTER TABLE piece ADD CONSTRAINT FK_44CA0B233DA5256D FOREIGN KEY (image_id) REFERENCES media_object (id)');
        $this->addSql('CREATE INDEX IDX_44CA0B233DA5256D ON piece (image_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE piece DROP FOREIGN KEY FK_44CA0B233DA5256D');
        $this->addSql('DROP INDEX IDX_44CA0B233DA5256D ON piece');
        $this->addSql('ALTER TABLE piece ADD file_path VARCHAR(255) DEFAULT NULL, DROP image_id');
    }
}
