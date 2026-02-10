# Supply-Chain-Reviews
Pour les collègues : Comment reprendre les dependecies du projet (ou comment passer son projet à son voisin)
Y a toute l'histoire de venv pyenv conda anaconda et les déboires du projet open source qui devient payant ...
donc aujourd'hui et depuis 2024, y a une réaction de la communauté et l'action de la société "astral" avec "uv"

LE CHOIX DU MOMENT EST DE TRAVAILLER AVEC uv 
(astral uv - a voir sur leur site les modalités d'installation varié (pip install uv) et l'inscription de la commande dans l'environement)

ayant installé les dépendances avec uv add, le fichier pyprojet.toml s'est mis à jours progressivement

installation de uv se fait soit via le site astral uv ou via un "pip install uv"

entuite le jeux de commande

# APRES UN GIT CLONE
on peut faire un :: uv sync

il va ramasser la liste de course 'pyproject.toml' et le dernier ticket de caisse 'uv.lock' pour instantanément
reconstruire le .venv du projet pour votre environement.


# EN CREATION DE PROJET
si vous initiez un nouveau projet pour une équipe
après le clone du repos vide de git hub
Dans le dossier cloné vous faite un :: uv init

il peut y avoir un :: pyenv version
et au besoin un :: pip install uv

se placer dans la version, par ex :: pyenv local 3.10.0
créer un environement python dédier au projet :: uv env -p 3.10.0 .venv
.venv ou venv comme on veux

bien vérifier AVANT LE PREMIER COMMIT que tous les venv ou .venv AINSI QUE les secrets dans .env
soit inscrit dans le ".gitignore" pour ne pas inscrire ces fichiers dans le commit
D'ABORD IL SERONT REFUSES DANS LE PUSH ET EN PLUS LE .env SERA TRES CHIANTS A SUPPRIMER DU COMMIT LOCAL ( rebase ... )

DONC PRIMORDIAL DE FICELER SON .gitignore AVANT LE PREMIER COMMIT
(fitre sur secret et sur data, un dossier data un peu lourd peu aussi contentir son .gitignore)

les installs des dépendances et des modules python qui vont bien avec :: uv add machin truc
la mise à jour de uv.lock (le ticket de caisse) :: uv lock


Dans python, pour travailler en relatif sur un dossier local ./data ou .\data on travaillera avec la fonction "Path" pour la portabilité du projet windows/linux
ce pose ici la question de commencer à partager de la data via github ???

Après le .gitignore on peut commencer les cycles [git add, git commit, git push]
git commit -m "

Plusieurs manière de ne pas se marcher sur les pieds:
- dans la meme branche, les devs travaille sur des fichiers différents - chacun push son fichier dans le main et tout va bien
- si pas possible, alors travailler dans une autre branche et organiser une session de merge de branche et de PR 'pull Request'


Est-ce qu'on archive les données ? toujour délicat, c'est versionné tout ca, à chaque fois que les résultats change, pof version, les données d'entrée peut être, et encore.


