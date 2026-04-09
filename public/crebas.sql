


drop table if exists ARCHIVE;

drop table if exists DEPARTEMENT;

drop table if exists EMPLOYE;

drop table if exists POSTE;

drop table if exists UTILISATEUR;


/* Table : ARCHIVE*/

create table ARCHIVE
(
   ID_ARCHIVE           int not null,
   ID_EMPLOYE           int not null,
   PHOTO LONGBLOB,
  NOM TEXT,
  PRENOM TEXT,
  ADRESSE TEXT,
  POSTE TEXT,
  TELEPHONE TEXT,
  DEPARTEMENT TEXT,
  E_MAIL TEXT,
  DATE_D_EMBAUCHE DATETIME,
  STATUT TEXT,
   DATE_D_ARCHIVE       date,
   primary key (ID_ARCHIVE)
);


/* Table : DEPARTEMENT */

create table DEPARTEMENT
(
   ID_DEPARTEMENT       int not null,
   ID_EMPLOYE           int not null,
   NOM_DEPARTEMENT      text,
   -- DESCRIPTION          text,
   CODE                  text,
   primary key (ID_DEPARTEMENT)
);


/* Table : EMPLOYE */

create table EMPLOYE
(
   ID_EMPLOYE           int not null,
   NOM                  text,
   PRENOM               text,
   E_MAIL               text,
   TELEPHONE            int,
   PHOTO                longblob,
   DATE_D_EMBAUCHE      datetime,
   STATUT               text,
   primary key (ID_EMPLOYE)
);


/* Table : POSTE*/

create table POSTE
(
   ID_POSTE             int not null,
   ID_EMPLOYE           int not null,
   NOM_POSTE            text,
   -- DESCRIPTION          text,
   -- SALAIRE              int,
    CODE                  text,
   primary key (ID_POSTE)
);


/* Table : UTILISATEUR  */

create table UTILISATEUR
(
   ID_UTILISATEUR       int not null,
   ID_EMPLOYE           int not null,
   NOM                  text,
   PRENOM               text,
   E_MAIL               text,
   MOTS_DE_PASSE        text,
   ROLE                 text,
   DATE_CREATION        datetime,
   primary key (ID_UTILISATEUR)
);

alter table ARCHIVE add constraint FK_ARCHIVAGE foreign key (ID_EMPLOYE)
      references EMPLOYE (ID_EMPLOYE) on delete restrict on update restrict;

alter table DEPARTEMENT add constraint FK_OCCUPE foreign key (ID_EMPLOYE)
      references EMPLOYE (ID_EMPLOYE) on delete restrict on update restrict;

alter table POSTE add constraint FK_OBTIENT foreign key (ID_EMPLOYE)
      references EMPLOYE (ID_EMPLOYE) on delete restrict on update restrict;

alter table UTILISATEUR add constraint FK_GERE foreign key (ID_EMPLOYE)
      references EMPLOYE (ID_EMPLOYE) on delete restrict on update restrict;

