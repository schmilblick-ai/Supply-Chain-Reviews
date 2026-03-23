# Supply-Chain-Reviews
Pour les collègues : Comment reprendre les *dependencies* du projet (ou comment passer son projet à son voisin). 
Y a toute l'histoire de venv pyenv conda anaconda et les déboires du projet open source qui devient payant ...
donc aujourd'hui et depuis 2024, y a une réaction de la communauté (pymanager) 
et l'action de la société *astral* avec [`uv`]https://docs.astral.sh/uv/guides/scripts/#declaring-script-dependencies

## LE CHOIX DU MOMENT EST DE TRAVAILLER AVEC uv 
(astral uv - a voir sur leur site les modalités d'installation varié (`pip install uv`) et l'inscription de la commande dans l'environement)

ayant installé les dépendances avec uv add, le fichier pyproject.toml s'est mis à jours progressivement

installation de uv se fait soit via le site astral uv ou via un :: `pip install uv`
Mais attention, pour gérer différente version de python il faudra jongler avec pymanager - voir ci-dessous

entuite le jeux de commande

## APRES UN GIT CLONE
on peut faire un :: `uv sync` ou `uv sync --active` s'il y a plusieurs environement et qu'on souhaite 
syncer l'env actif (obtenu au forcepts par `source bla/Scripts/activate`)

il va ramasser la liste de course 'pyproject.toml' et le dernier ticket de caisse 'uv.lock' pour instantanément
reconstruire le .venv du projet pour votre environement.
Et voilà !

## EN CREATION DE PROJET
Si vous initiez un *nouveau projet* pour une équipe
après le clone du repos vide de git hub
Dans le dossier cloné vous faite un :: `uv init`

il peut y avoir un :: `pyenv version` ou plutot préférablement un `pymanager list`
et au besoin un :: `pip install uv`

se placer dans la version, par ex :: `pyenv local 3.10.0`
créer un environement python dédier au projet :: `uv env -p 3.10.0 .venv`
.venv ou venv comme on veux

Bien vérifier AVANT LE PREMIER COMMIT que tous les venv ou .venv AINSI QUE les secrets dans *\*.env*\* et *\*.venv*\*
soit inscrit dans le *.gitignore* pour ne pas inscrire ces fichiers dans le commit.
D'ABORD IL SERONT REFUSES DANS LE PUSH ET EN PLUS LE .env SERA TRES CHIANTS A SUPPRIMER DU COMMIT LOCAL ( rebase ... )

DONC PRIMORDIAL DE FICELER SON *.gitignore* AVANT LE PREMIER COMMIT
(filtre sur secret et sur data, un dossier data un peu lourd peu aussi contentir son .gitignore)

les installs des dépendances et des modules python qui vont bien avec :: `uv add machin truc`
la mise à jour de uv.lock (le ticket de caisse) :: `uv lock`

d'une manière général, traduire toute les vielles suggestion `pip install truc` par `uv add truc` et 
tout les  `pip uninstall truc` par `uv remove truc`

J'ai noté toutefois qu'en cas de remove dans plusieurs version, si on a qu'un seul pyproject.toml, celui-ci est cleaner sur la première version traité
donc certainement le `pip uninstall` peu conserver son utilité pour cleaner une autre version de python pour le projet.

## Reco Path pour portabilité linux, windows

    Dans python, pour travailler en relatif sur un dossier local ./data ou .\data on travaillera avec la fonction "Path" pour la portabilité du projet windows/linux
    ce pose ici la question de commencer à partager de la data via github ???

## premiere actions après l'install
Après le .gitignore on peut commencer les cycles [`git add .`, `git commit -m "bla"`, `git push`]
`git commit -m "mettre une description approprié n'est jamais une mauvaise chose"`

## SE PASSER LE BALLON 🏀
git, c'est du sport collectif. Comment se passer le ballon ? Plusieurs manière de ne pas se marcher sur les pieds:
- dans la meme branche, les devs travaillent sur des fichiers différents - chacun push son fichier dans le main et tout va bien
- si pas possible, alors travailler dans une autre branche et organiser une session de merge de branche et de PR 'pull Request'
- LA doc [gitPro]https://git-scm.com/book/en/v2
- On peut longtemps regarder les autres jouer à un jeu sans jamais y prendre part - comme moi le cricket par exemple, mais bon !
- Se mettre dans les conditions de pouvoir partager son travail avec qq ou un autre environement, c'est faire grandir sa part de voix !

## ET LES DATAS ?
Est-ce qu'on archive les données ? toujour délicat, c'est versionné tout ca, à chaque fois que les résultats change, pof version, les données d'entrée peut être, et encore.

## pymanager :: changement de version python sur win - choix de passer par le Python install manager CONFIGURATION
`py --install manager`
- setting :: y (Your app execution alias settings are configured to launch other commands besides 'py' and 'python')
- 260 > chars for long file name :: y (Windows is not configured to allow paths longer than 260 characters.)
- Add commands directory to your PATH now? [y/N] :: y (The global shortcuts directory is not configured.)
- Install CPython now? [Y/n] ::Y (You do not have the latest Python runtime.)
- https://docs.python.org/dev/using/windows


## pymanager - version par défaut et uv venv

PROMPT en python avec le pymanager, quand je liste les versions, avec `pymanager list`, la version de python par défaut à une étoile. est-il possible et utile de changer l'étoile et la version de python par défaut avant d'installer un venv avec uv ?

Réponse Antropic/Claude

L'étoile dans py list — ce qu'elle signifie
L'étoile indique quelle version de Python est la version par défaut selon le Python Installation Manager. 
InfoWorld
 C'est elle qui sera utilisée quand vous tapez simplement py ou python sans préciser de version.

Peut-on changer la version par défaut ?
Oui. Si vous avez besoin de changer la version par défaut, vous pouvez le faire via la variable d'environnement PYTHON_MANAGER_DEFAULT ou via la section Configuration de la documentation. 
Pages

powershell
### Pour la session courante (PowerShell)
## alors## alors
 `$env:PYTHON_MANAGER_DEFAULT = "3.11"`

### Ou de façon permanente via les variables d'environnement Windows
Est-ce utile de le faire avant uv venv ?
En pratique, non — et voici pourquoi.

uv n'utilise pas du tout la version par défaut de pymanager pour choisir l'interpréteur de votre venv. Il a sa propre logique de sélection. La bonne façon de contrôler la version avec uv, c'est de la spécifier directement :

#### Option 1 — Au moment de créer le venv :

git-bash
`uv venv --python 3.11`

#### Option 2 — Épingler la version pour tout le projet (recommandé) :

git-bash
`uv python pin 3.11`
Cela écrit 3.11 dans un fichier .python-version, que uv lira à chaque commande. 
PyPI

#### Option 3 — Via pyproject.toml  (bof) :

    toml
    [project]
    requires-python = ">=3.11"


*En résumé*

| Besoin	                                               |        Solution                 |
| -------------------------------------------------------- | ------------------------------- |
| Changer la version par défaut de py / python globalement | `PYTHON_MANAGER_DEFAULT`        |
| Contrôler la version d'un venv uv	                       | `uv venv .venvbla --python 3.x` |
| Épingler la version pour un projet entier	               | `uv python pin 3.x`             |

La bonne pratique avec uv est de toujours épingler la version au niveau du projet avec uv python pin, plutôt que de se reposer sur une version globale par défaut. Ça rend le projet reproductible indépendamment de ce qui est configuré dans *pymanager*.


## en utilisant uv, les instructions éventuels de correcton son en python ou en pip.
    par exemple, dois-je traduire python.exe -m pip install ipykernel -U --force-reinstall'
    en uv équivalent ?

    Bonne question, et la réponse est : ça dépend du contexte.

    Règle générale avec uv
    Si la commande cible un venv géré par uv, vous pouvez souvent la traduire. Mais si c'est une instruction ponctuelle de correction (par exemple depuis une popup VS Code ou Jupyter), il faut savoir ce qu'elle fait vraiment.

    Votre exemple : python.exe -m pip install ipykernel -U --force-reinstall
    Cette commande :

    installe/réinstalle ipykernel dans l'environnement Python courant
    avec `-U (upgrade)` et `--force-reinstall`

Traduction uv :
bash
`uv pip install ipykernel -U --force-reinstall`
uv supporte nativement les flags pip classiques, donc la traduction est directe — remplacez simplement python -m pip par uv pip.

Mais attention — dans quel environnement ?
La subtilité importante : `python.exe -m pip install` installe dans l'environnement associé à ce python.exe précis. 
Avec uv, assurez-vous que votre venv est bien activé, ou précisez-le :

bash
# Venv activé → fonctionne directement
`uv pip install ipykernel -U --force-reinstall`

# Venv non activé → ciblez-le explicitement
`uv pip install ipykernel -U --force-reinstall --python .venv/Scripts/python.exe`
Tableau de traduction rapide

| Ancienne commande	                        | Équivalent uv       |
| ----------------------------------------- | -------------       |
| python -m pip install X                   | uv pip install X    |
| python -m pip install -U X                | uv pip install -U X |
| python -m pip install -r requirements.txt	| uv pip install -r requirements.txt |
| python -m pip uninstall X	                | uv pip uninstall X  |
| python -m pip freeze	                    | uv pip freeze       |
| pip install X	                            | uv pip install X    |

mais pensez aussi `uv add`, `uv remove`

Cas où vous ne traduisez PAS
Si l'instruction vient d'un outil externe (VS Code, Jupyter, un script de setup) et qu'elle cible un environnement spécifique via un chemin absolu vers python.exe, il vaut mieux la laisser telle quelle — elle sait exactement dans quel environnement elle installe. La traduire en uv pip sans vérifier le contexte pourrait installer dans le mauvais endroit.

## cas d'outils dev local lié à jupyther ou l'environement, sans impacte sur le projet
Une section des dépendencies group du toml gére le sujet

        [dependency-groups]
        dev = [
            "ipykernel>=7.2.0",
            "pip>=26.0.1",
        ]

## Est-ce que `uv add` et `uv pip install` sont équivalente ?

Réponse: 
Non, elles ne sont pas équivalentes — elles ont des philosophies différentes. `uv add`, c'est du `uv pip install` augmenté

    uv pip install — mode "pip classique"
    C'est une opération manuelle et directe, sans mémoire :

    Installe le package dans le venv
    Ne touche pas à pyproject.toml ni à uv.lock
    Rien n'est tracé → si vous recréez le venv, le package est perdu
    Équivalent à pip install, juste plus rapide

bash
`uv pip install requests`
### → installé dans le venv, mais "oublié" si on recrée l'environnement
    uv add — mode "projet géré"
    C'est une opération déclarative et traçée :

    Ajoute le package dans pyproject.toml (section [project] dependencies)
    Met à jour uv.lock avec les versions exactes résolues
    Installe le package dans le venv
    Reproductible : uv sync recrée exactement le même environnement
    bash

`uv add requests`
### → pyproject.toml mis à jour + uv.lock mis à jour + installé

    
    | Résumé                      | uv pip install | uv add | 
    | --------------------------- | ---------------| ------ |
    | Installe dans le venv       | ✅             | ✅    | 
    | Met à jour pyproject.toml   | ❌             | ✅    | 
    | Met à jour uv.lock	      | ❌             | ✅    | 
    | Reproductible	              | ❌             | ✅    | 
    | Nécessite un projet uv init | ❌             | ✅    | 

    Usage typique	correction ponctuelle, script	dépendance durable du projet
    Recommandation pratique
    Pour un projet uv structuré → utilisez uv add systématiquement
    Pour corriger un problème ponctuel (comme le ipykernel --force-reinstall de votre exemple) → uv pip install est adapté, c'est une intervention chirurgicale qui n'a pas vocation à être tracée dans les dépendances du projet.


### Pourquoi est-ce que ipykernel n'a pas lieu de mériter un uv add ?

    C'est une excellente remarque — et en fait, ça dépend de votre usage.

    Pourquoi on le traite souvent en uv pip install (ponctuel)
    ipykernel est souvent installé suite à un message automatique de VS Code ou Jupyter du type :

    "Install ipykernel to use Jupyter notebooks?"

    Dans ce cas, c'est une correction d'infrastructure locale — l'outil qui fait tourner le notebook — pas une dépendance de votre code. On le traite alors comme un outil de dev environment, pas comme une dépendance du projet.

    Mais en réalité, uv add --dev est souvent la bonne réponse
    Si vous utilisez des notebooks Jupyter dans votre projet, ipykernel mérite d'être tracé, sinon :

    un collègue qui clone le repo et fait uv sync n'aura pas Jupyter qui fonctionne
    vous-même, si vous recréez le venv, devrez vous souvenir de le réinstaller

   *bash*
    `uv add requests`
    `uv add --dev ipykernel`

    L'option --dev le place dans les dépendances de développement 

   toml
    [dependency-groups]
    dev = [
        "ipykernel",
    ]

### Règle de décision simple
    | Question	                                          | Réponse → action      |
    | --------------------------------------------------- | --------------------- |
    | Est-ce que ce package est importé dans mon code ?   |	Oui → uv add          |
    | Est-ce que tous les devs du projet en ont besoin ?  |	Oui → uv add --dev    |
    | C'est juste pour déboguer une fois sur ma machine ? | uv pip install suffit |


   *Conclusion :*
    Vous avez raison de questionner — pour un projet avec des notebooks, uv add --dev ipykernel est la bonne pratique. 
    Le traiter en uv pip install ponctuel est une habitude héritée de l'époque pip où on ne traçait pas tout, mais avec uv, autant en profiter pour être rigoureux.

### bs4 ou beautifullsup4 sont la même chose (aliasing?)

    Ce qu'il faut savoir pour Python 3.12
    Le vrai choix à faire n'est pas bs4 vs beautifulsoup4, mais le parser à utiliser avec :
    | Parser | Installation | Vitesse | Tolérance HTML bancal |
    | html.parser | inclus dans Python | moyenne | bonne |
    | lxml   | uv add lxml |⚡ très rapide | très bonne
    | html5lib | uv add html5lib | lente | excellente (HTML5 strict)


   python
    `from bs4 import BeautifulSoup`

   # Selon votre besoin
    `soup = BeautifulSoup(html, "html.parser")  # sans dépendance extra`
    `soup = BeautifulSoup(html, "lxml")         # recommandé pour la perf`
    `soup = BeautifulSoup(html, "html5lib")     # si HTML5 strict nécessaire`

   # Recommandation pratique
    bashuv add bs4 lxml
    bs4 + lxml est la combinaison la plus courante 
    et la plus performante pour du scraping en Python 3.12.


# Routine d'installation python et env
    # reco de passer par pymanager combiné avec uv, 
    # pymanager pour installer les versions primaires de python et uv pour gérérer les dépendences et install/sync projet

## d'abord installation de plusieurs version primaire de python
    `pymanager list`
    `pymanager install 3.12`
    `pymanager install 3.13`
    `pymanager install 3.14`

    pymanager list
    uv venv --python 3.12 #crée un .venv en 3.12
    uv venv .venv313 --python 3.13
    uv venv .venv314 --python 3.14

    # Attention au source .venv314/Scripts/activate, inversé les \ / si on est en git_bash
    source .venv314/Scripts/activate

## sync de la version source active
    uv sync --active

    #vérif de version
    python --version

## One liner de vérif de module ou version de module
    python -c "import platform,sys ; print(platform.machine()) ;print(sys.platform) "
    source .venv314/Scripts/activate

    # etre actif sur le toml, vérifier les recos possible pour son cas d'usage

## supprimer ou éffacer : le droit à l'erreur
    - activer un autre environement avant de supprimer un env python, 
        sinon la commande python.exe et le dossier peuvent rester en vrac après le delete (open handler)

    - un module en trop ? uv remove
        prereq: le toml doit avoir la dépendencies de ce qu'on veut enlever - sinon pip uninstall
        la section dépendencies est sync avec le uv remove
        ex: uv remove torchvision torchaudio

    comprendre quand le uv python pin 3.12 devient essentiel

Vous les connaissez ces pages de documentation, sans exemple et sans illustration - qui donc ne serve à rien
Vous les voyez ces documentations inutiles, tous les parametres sont décrits, et quand vous avez finit de lire, vous savez toujours pas ou en venir !

Construisons un site web, xamples.io - un lien vers une page externe - une référence pour donner du contexte, un exemple métier illustré concret
risque du broken link évident, mais 

## C'est gros torch
    Bon torch c'est très gros ~6GB+, c'est lié au dll (1,2GB) et à la méthodo SYCL qui encapsule la compile de plusieurs architecture dans le même fichier
    Windows ne charge pas toute la DLL en RAM au moment de l'import. Il utilise le memory-mapped file (MMF) — la DLL est mappée dans l'espace d'adressage virtuel, et seules les pages réellement accédées sont chargées physiquement en RAM. Les kernels SYCL compilés pour Arc A-series, B-series, etc. ne sont chargés en mémoire que quand vous appelez l'opération correspondante. Si vous faites uniquement des embeddings, seule une fraction des kernels est réellement chargée.

## levé de sécurité sur le PC - Abandon
## passage en openvino certifié intel

## one liner pour voir si ca marche

`python -c "import openvino as ov, sys; print(ov.Core().available_devices, sys.version)"`

 pymanager list
 uv venv .venv312 --python=3.12
 uv venv .venv313 --python=3.13
 uv venv .venv314 --python=3.14

### faire trois env et les tester
    source .venv312/Scripts/activate
    uv python pin 3.12
    python -V
    uv sync --active
    python -c "import openvino as ov, sys; print(ov.Core().available_devices, sys.version)"

    source .venv313/Scripts/activate
    uv python pin 3.13
    uv sync --active
    python -c "import openvino as ov, sys; print(ov.Core().available_devices, sys.version)"
    
    source .venv314/Scripts/activate
    uv python pin 3.14
    uv sync --active
    python -V
    uv sync --active
    python -c "import openvino as ov, sys; print(ov.Core().available_devices, sys.version)"

   # on obtient respectivement:

    ['CPU', 'GPU', 'NPU'] 3.12.12 (main, Feb  3 2026, 22:54:57) [MSC v.1944 64 bit (AMD64)]
    ['CPU', 'GPU', 'NPU'] 3.13.12 (tags/v3.13.12:1cbe481, Feb  3 2026, 18:22:25) [MSC v.1944 64 bit (AMD64)]
    ['CPU', 'GPU', 'NPU'] 3.14.3 (tags/v3.14.3:323c59a, Feb  3 2026, 16:04:56) [MSC v.1944 64 bit (AMD64)]


    Prendre de soin de vérifier si rien de contraignant dans le pyproject.toml file (genre <3.14 )
    VERFIER LE .gitignore, y ajouter les .venv* et pour toute version alternative, mettre à jour le .gitignore est essentiel

    en cas de panne, ce sont les commandes de sécurité pour reconstruire l'environement rapidement
    analyser éventuellement la dépendence qui aurait ruiner le projet

    J'ai observé, dans certaine circonstance, manip uv ou autre, la disparition du .venvXXX/Scripts/activate

A partir de là on peut continuer à tout casser !!

Ajuster le kernel sur le classeur, redémarrer les céllules bloque par bloque à partir des OUTLINES ...
