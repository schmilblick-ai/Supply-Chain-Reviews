/*
S C R A P P I N G   T O O L B O X  in javascript

Les fonctions principales du script
	- initDB                    Initialise l'indexedDB
	- connectDB                 Séparation des responsabilité, se connect à l'indexDB
	- mainDBdef                 -> à runner pour faire l'initDB
	- waitForLoad               un temporisateur    
	- extraireAvisTrustpilot    un essai
	- startScraping             -> Ici c'est le scrapper
    - genericExportCSV          -> à runner à la fin pour faire un export CSV


Trois fonctions de base à lancer dans l'ordre
- mainDBdef()
- startScraping("oscaro.com",101,200);
- genericExportCSV(MY_DB,"avis")

la première définit la base ScraperDB et le store "avis" (et aussi logs et metadata mais que je n'utilise pas)
la second instruction role le scrapper avec le spider TrustPilote sur oscaro.com (normalement on a plusieurs spider et on les branches conditionnellement, mais ici c'est mono TP), ca circule, collecte, stocke.
le troisième instructon transpose le résultat en CSV

Pour les windows.open, pensez à dévérouiller l'accés au popup pour le site que vous explorez

*/

/*================analysis of fields of importance
tag time data-cmpl
in div class="styles_consumerExtraDetails__NY6RP" -> data-consumer-reviews-count
consumer-name-typography

art.querySelectorAll("div[data-service-review-rating]")[0].getAttribute("data-service-review-rating")

pour les dates on en a deux :
date commentaire -> tag <time>
date expérience -> dans le data-review-content, le span
intéressant d'avoir le temps entre l'expérience et le commentaire
trouvé aussi des cas ou il y a un suivi de l'entreprise et rammassé le suivi !
============================================================
*/

/* I N D E X E D   D B   T O O L B O X  ====================================================================
* List of function to managed data we collect in a local, web site dependent database with database/table 
* layout/architecture
*/

/* L'astuce visuelle de gestion d'une base IndexDB dans le navigateur (Sans code) dans F12 DevTools
Tu n'as pas forcément besoin de taper du code pour "voir" ou "droper". 
Les navigateurs modernes offrent une interface graphique pour IndexedDB :
    - Fais F12 (Outils de développement).
    - Va dans l'onglet Application (sur Chrome/Edge) ou Stockage (sur Firefox).
    - Dans le menu de gauche, déroule IndexedDB -> ScraperDB -> avis.
    - Pour voir : Clique sur "avis", les données s'affichent à droite sous forme de tableau.
    - Pour supprimer un seul avis : Clic droit sur la ligne -> "Delete".
    - Pour tout vider : Clique sur "avis" et appuie sur le bouton "Clear object store" (l'icône de cercle barré).

Nombre d'avis accessible ?

pour oscaro ?
https://www.trustpilot.com/review/oscaro.com?languages=all&page=9339 contre 10300 pages
https://www.trustpilot.com/review/oscaro.com?page=113
https://www.trustpilot.com/review/oscaro.com?languages=fr&verified=true
"Popular Mentions" exists

	Delivery service
	Order
	Product
	Price
	Quality
	Service
	Mistake
	Warranty
	Website
	Refund
	Customer service
	Competition
	Customer communications
	Recommendation
	Location
	Payment
	Inventory




attention au 404 not found

comparatif ?

ATTENTION A l'API trustpilot et notamment au FILTRE
https://www.trustpilot.com/review/oscaro.com?page=113 -> limitation à 2500 avis par défault associé à Language = EN

cette première URL naive ne permet pas de parcourir les 200000 avis d'oscaro par exemple -> il faut ajouter le filtre languages=All
-> EST-CE UNE MANIERE DE MASQUER DES AVIS DANS LES MEANDRES DE FILTRE ???
Il semble nécessaire d'ajouter le filtre languages=all
https://www.trustpilot.com/review/oscaro.com?languages=all&page=2
https://www.trustpilot.com/review/oscaro.com?languages=all&page=113  
https://www.trustpilot.com/review/oscaro.com?languages=all&replies=true&verified=true

93390 -> 186 780 avis dispo contre 206,005

succés cher,

pb de mémoire, fuite de la page, 4.5gb/!\ - A voir les éléments qui fuite en mémore, comme la collecte "Results" a ne pas faire
ou l'allocation des nouvelles pages
des snapshots doivent permettre de comprendre

O P T I M I S A T I O N du script
    Pourquoi console.log(newWin) est fatal ?
    En JavaScript, la console n'affiche pas juste du texte, elle garde une référence vivante vers l'objet. Si tu logges newWin :

    Tu logges l'objet Window.

    Cet objet contient le document entier (tout le HTML de Trustpilot).

    Le document contient des milliers de nœuds DOM.

    Le Garbage Collector ne peut rien supprimer, car il se dit : "L'utilisateur pourrait vouloir cliquer sur ce log dans la console pour inspecter la fenêtre, je dois tout garder en RAM".

    Même si tu fais newWin.close(), l'objet reste "vivant" dans les archives de ta console. Multiplié par 100 pages, tu stockes 100 arbres DOM complets.

    Comment traquer ce qui reste dans le Heap Snapshot ?
    Maintenant que tu as commenté les logs, si la mémoire monte encore, voici ce qu'il faut chercher précisément dans ton prochain snapshot (en mode Summary) :

    1. Cherche "Detached HTMLDivElement" ou "Detached Element"
    C'est le signe n°1 d'une fuite de scraping.

    C'est quoi ? Ce sont des morceaux de pages web (les avis que tu as scrapés) qui ne sont plus affichés à l'écran mais qui sont toujours retenus en mémoire par une variable JS.

    Le coupable : Souvent une variable globale ou une promesse await qui n'est jamais arrivée à son terme.

    2. Cherche "Closure"
    Si tu vois le nombre de closures exploser, regarde les Retainers en bas.

    Cherche si tu vois setTimeout ou setInterval.

    Si un setInterval (comme dans ton waitForLoad) n'est pas stoppé avec clearInterval en cas d'erreur, il garde en mémoire tout le contexte de la page, même après la fermeture de l'onglet.

    Le "Nettoyage Manuel" pour confirmer
    Pour savoir si tes modifs fonctionnent sans relancer tout le script, tu peux forcer un nettoyage dans la console :

    Tape console.clear(); (ça vide les références retenues par l'historique de la console).

    Clique sur l'icône de la petite poubelle dans l'onglet Memory.

    Regarde si ton compteur de RAM (dans le gestionnaire de tâches Chrome Maj+Echap) descend.

    Une dernière astuce de performance
    Si tu veux garder des logs sans saturer la RAM, ne logge que des types primitifs (Strings/Numbers) :

        Mauvais : console.log(newWin);
        Mauvais : console.log(avisPage);
        Bon : console.log("Page chargée : " + newWin.location.href);
        Bon : console.log(Extraction finie : ${avisPage.length} avis trouvés);

    Est-ce qu'après avoir commenté le log de newWin, tu as remarqué une stabilisation de la consommation de RAM sur tes 10 ou 20 premières itérations ?


    pb, pendant que ca tourne, le vavigateur est inutilisable, comment on fait ? 
    "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:/temp/chrome_scraping"
    connecton
    F12
    copie du scripte
    Attention, nouveau context, risque de perte de Application/IndexedDB

*/



//============ U T I L I T I E S ========================================================

/**
 * Query il peut donc ne pas être possible de tout récupérer dans request - un parcours par lots sera due
 * Attention, le getAll peut être ennuyeux.
 * @param {*} MYDB 
 * @param {*} aTable 
 * @param {*} conditionFn 
 */
async function requeterDB(MYDB,aTable,conditionFn) {
    const db = await connectDB(MYDB);
    const transaction = db.transaction([aTable], "readonly");
    const mytable = transaction.objectStore(aTable);
    const request = mytable.getAll();

    request.onsuccess = () => {
        const resultats = request.result;
        console.log(`Total en base : ${resultats.length} ${aTble}.`);
        
        // Exemple : Afficher seulement les avis avec une note spécifique
        //const mauvaisAvis = resultats.filter(a => a.note.includes("1"));
        //du coup avec une condition spécifique
        const queryResults = resultats.filter(conditionFn);

        console.log("Nombre de mauvais avis (1 étoile) :", queryResults.length);
        console.table(resultats.slice(-5)); // Affiche les 5 derniers ajoutés
    };
}


/**
 * BulkQuery ou requete par lot, si la base est importante, éviter de tout mettre en mémoire avec le getAll peut être salutaire
 * @param {*} MYDB 
 * @param {*} aTable 
 * @param {*} batchSize 
 * @param {*} conditionFn 
 * @returns 
 */
async function bulkQuery(MYDB, aTable, batchSize = 100,conditionFn) {
    const db = await connectDB(MYDB);
    const transaction = db.transaction([aTable], "readonly");
    const store = transaction.objectStore(aTable);
    const cursorRequest = store.openCursor();

    let batch = [];
    let batchFilters = [];
    let totalTraite = 0;

    return new Promise((resolve) => {
        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            
            if (cursor) {
                //on accumule les valeurs du curseur
                batch.push(cursor.value);
                
                // Si le lot est plein
                if (batch.length === batchSize) {
                    //traiterLeLot(batch); // Ta fonction de traitement
		            batchFilters.push(...batch.filter(conditionFn));
                    totalTraite += batch.length;
                    batch = []; // On vide pour le lot suivant
                }
                
                cursor.continue();
            } else {
                // Traitement du dernier lot incomplet
                if (batch.length > 0) {
                    //traiterLeLot(batch);
		            batchFilters.push(...batch.filter(conditionFn));
                    totalTraite += batch.length;
                }
                console.log(`Traitement terminé : ${totalTraite} lignes.`);
		        console.table(batchFilters)	
                resolve(batchFilters);
            }
        };
    });
}


/**
 * Drop all records - Truncate function
 * @param {*} MYDB 
 * @param {*} storeName 
 */
async function TruncateTable(MYDB,storeName) {
    const db = await connectDB(MYDB);
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
        console.log(`La table ${storeName} a été vidée avec succès.`);
    };
}


/**
 * supprimerBaseComplete
 * @param {*} MYDB 
 */
function supprimerBaseComplete(MYDB) {
    const request = indexedDB.deleteDatabase(MYDB);
    
    request.onsuccess = () => console.log(`Base de données ${MYDB} supprimée.`);
    request.onerror = () => console.error("Erreur lors de la suppression.");
    request.onblocked = () => console.warn("Suppression bloquée : ferme les autres onglets du site !");
}

/**
 * exportNettoye NOT TO USE, TOO MUCH SPECIFIC due to key -better is to clean elsewhere
 * @param {*} MYDB 
 * @param {*} storeName 
 */
async function exportNettoye(MYDB,storeName) {
    const db = await connectDB();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const rawData = request.result;
        console.log(`Données brutes en base : ${rawData.length} entrées.`);

        // --- NETTOYAGE DES DOUBLONS ---
        const vus = new Map();
        
        rawData.forEach(item => {
            // On crée une clé unique (Auteur + début du commentaire)
            const cle = `${item.auteur}_${item.commentaire.substring(0, 50)}`;
            
            if (!vus.has(cle)) {
                vus.set(cle, item);
            }
        });

        const dataNettoyee = Array.from(vus.values());
        // ------------------------------

        console.log(`Données après nettoyage : ${dataNettoyee.length} avis uniques.`);

        // Téléchargement du fichier
        const blob = new Blob([JSON.stringify(dataNettoyee, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trustpilot_data_clean_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    };
}

/**
 * drop with Where condition utility - to test and check
 * @param {*} MYDB -- for a given database
 * @param {*} aStore -- and a given store
 * @param {*} conditionFn -- we can apply a condition on value field to select the records we would like to drop
 * // --- EXEMPLES D'UTILISATION ---

// 1. Supprimer les avis où le commentaire est vide
// dropWhere(a => a.commentaire.length === 0);

// 2. Supprimer les avis d'un auteur spécifique
// dropWhere(a => a.auteur === "Anonyme");

// 3. Supprimer les avis ayant une note de 1
// dropWhere(a => a.note.includes("1"));

 */
async function dropWhere(MYDB,aStore,conditionFn) {
    const db = await connectDB(MYDB);
    const transaction = db.transaction([aStore], "readwrite");
    const store = transaction.objectStore(aStore);
    const cursorRequest = store.openCursor();
    
    let count = 0;

    cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            // On teste la condition passée en argument
            if (conditionFn(cursor.value)) {
                cursor.delete();
                count++;
            }
            cursor.continue(); // Passe à l'enregistrement suivant
        } else {
            console.log(`Suppression terminée : ${count} enregistrements supprimés.`);
        }
    };
}



/**
 * This is an example of migration scripte ? you say migrate ? WARNING, VERY SPECIFICI
 * @param {*} MYDB -- the database 
 * @param {*} aStore -- the specific table store (sotre are key values only)
 */
async function migrerAnciennesDonnees(MYDB,aStore) {
    const db = await connectDB(MYDB);
    const transaction = db.transaction([aStore], "readwrite");
    const store = transaction.objectStore(aStore);
    const cursorRequest = store.openCursor();

    cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const data = cursor.value;
            
            // Si le champ n'existe pas, on l'ajoute avec une valeur par défaut
            if (data.langue === undefined) {
                data.langue = "fr"; 
                cursor.update(data); // Met à jour l'enregistrement sur le disque
            }
            cursor.continue();
        } else {
            console.log("Migration terminée !");
        }
    };
}


/**
 * Initialise ou met à jour la structure de la base de données
 * @param {string} dbName - Nom de la base
 * @param {number} version - Version (incrémenter pour modifier le schéma)
 * @param {string[]} stores - Liste des magasins à créer
 */
function initDB(dbName, version, stores) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            stores.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { autoIncrement: true });
                    console.log(`[Init] Store créé : ${storeName}`);
                }
            });
        };

        request.onsuccess = (e) => {
            e.target.result.close(); // On ferme car ce n'est qu'une initialisation
            resolve();
        };
        
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Ouvre une connexion à la base sans se soucier du schéma
 * @param {string} dbName 
 */
function connectDB(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName); // Pas de version ici pour utiliser l'actuelle

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
        
        // Sécurité : si la base n'existe pas, on refuse l'ouverture sans init
        request.onupgradeneeded = (e) => {
            e.target.transaction.abort();
            reject(new Error("La base n'existe pas. Appelez initDB d'abord."));
        };
    });
}

async function mainDBdef() {
    try {
        // Étape 1 : On définit la structure une seule fois
        await initDB(MY_DB, 1, ["avis", "metadata", "logs"]);

        // Étape 2 : Partout ailleurs, on se connecte simplement
        //const db = await connectDB(MY_DB);
        
        // Utilisation...
        //const tx = db.transaction("avis", "readonly");
        // ...
        
    } catch (err) {
        console.error("Erreur :", err);
    }
}


/**
 * v0 testing aveArrayToDB - naive implementation  Write a Data Array to DB
 * @param {*} MYDB 
 * @param {*} myStore 
 * @param {*} dataArray 
 * @returns 
 */
async function saveArrayToDB0(MYDB,myStore,dataArray) {
    const db = await connectDB(MYDB);
    const transaction = db.transaction([myStore], "readwrite");
    const store = transaction.objectStore(myStore);

    dataArray.forEach(item => store.add(item));

    return new Promise((resolve) => {
        transaction.oncomplete = () => {
            console.log(`${dataArray.length} ${myStore} records ajoutés en base ${MYDB}.`);
            resolve();
        };
    });
}



/**
 * v1 testing aveArrayToDB On met async pour pouvoir utiliser await à l'intérieur
 * @param {*} dbName 
 * @param {*} storeName 
 * @param {*} dataArray 
 * @returns 
 */
async function saveArrayToDB1(dbName, storeName, dataArray) {
    // On attend la connexion
    const db = await connectDB(dbName); 

    // On retourne une promesse pour que l'appelant puisse attendre la FIN de la transaction
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        dataArray.forEach(item => {
            store.put(item);
        });

        // C'est ICI que la magie opère pour le "await"
        transaction.oncomplete = () => {
            db.close();
            resolve(); // Le await à l'extérieur se débloque ici
        };

        transaction.onerror = (e) => {
            reject(e.target.error); // Le await à l'extérieur lève une exception ici
        };
    });
}

/**
 * Persitence of data / dataArray in the indexed DB saveArrayToDB function
 * @param {*} dbName 
 * @param {*} storeName 
 * @param {*} data 
 * @returns 
 */
async function saveArrayToDB(dbName, storeName, data) {
    // 1. Sécurité : Si data est null ou undefined, on arrête tout
    if (!data) {
        console.warn("?? Aucune donnée à sauvegarder.");
        return;
    }

    // 2. Sécurité : Si c'est un objet seul, on le transforme en tableau
    // C'est ici qu'on règle l'erreur .forEach is not a function
    const dataArray = Array.isArray(data) ? data : [data];

    const db = await connectDB(dbName);
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        //console.log("dataArray ??",dataArray)  //on voyait une [Promise] faut mettre await devant la collect des avis
        dataArray.forEach(item => {
            // On vérifie que l'item n'est pas vide avant de sauvegarder
	    //console.log("TEST item",item)
            if (Object.keys(item).length > 0) {
                store.put(item);
            }
        });

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = (e) => reject(e.target.error);
    });
}

/**
 * backupDB allows to export a store to some other place - need to see if the getAll is relevant !!
 * @param {*} dbName 
 * @param {*} storeName 
 */
async function backupDB(dbName, storeName) {
    const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject("Erreur ouverture");
    });

    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const data = JSON.stringify(request.result);
        const blob = new Blob([data], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${storeName}_backup.json`;
        a.click();
        console.log("✅ Backup prêt !");
    };
}
// Utilisation :
//await backupDB("ScraperDB", "avis");

/**
 * importDB allows to reload the db
 * @param {*} dbName 
 * @param {*} storeName 
 */
async function importDB(dbName, storeName) {
    // Crée un sélecteur de fichier invisible
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        const data = JSON.parse(text);

        const db = await new Promise((resolve) => {
            const req = indexedDB.open(dbName);
            req.onsuccess = () => resolve(req.result);
        });

        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        data.forEach(item => store.put(item));

        transaction.oncomplete = () => {
            console.log(`✅ Importation de ${data.length} éléments réussie !`);
        };
    };

    input.click();
}


// Utilisation :
//await importDB("ScraperDB", "avis");

//============= L E  S P I D E R   T R U S T P I L O T  =============================================================

// this results variable was a primary in memory collection, and is inapropriate we will learn how to leverage IndexedDB - 
// let results = [];

/**
 * Extract Reviews from TrustPilot specifically - that is what we call a specifiq spider for web scrapping
 * @param {*} newDoc - qindow.document we target for scrapping in alternate window
 * @returns data collected
 */
async function SPIDER_AvisTrustpilot(newDoc) {
    // Trustpilot utilise des balises <article> pour chaque avis
    dataList=newDoc.querySelector('[data-reviews-list-start]');
    const articles = dataList.querySelectorAll('article');
    const data = [];

    articles.forEach(art => {
        // Extraction de l'auteur
        const auteur = art.querySelector('[data-consumer-name-typography]')?.innerText || "Anonyme";
        
        // Extraction de la note (souvent dans un attribut data-service-review-rating)
        const note = art.querySelector("[data-service-review-rating]").getAttribute("data-service-review-rating");

        // Titre et Corps de l'avis
        const titre = art.querySelector('[data-review-title-typography]')?.innerText || "";
        const texte = art.querySelector('[data-service-review-text-typography]')?.innerText || "";
        
        // Date de l'expérience
        const dateExp = art.querySelector("[data-testid='review-badge-date']").innerText || "";

        // Date de l'avis
        const dateAvis = art.querySelector('time[datetime]')?.innerText || "";

        // data service business reply
       const texteServiceReply = art.querySelector('[data-service-review-business-reply-title-typography]')?.innerText || "";
       const dateServiceReply = art.querySelector('[data-service-review-business-reply-date-time-ago]')?.innerText || ""
       const dataServiceReply = art.querySelector('[data-service-review-business-reply-text-typography]')?.innerText || ""
  

        data.push({auteur
            , note
            , titre
            , commentaire: texte
            , date_experience: dateExp
	        , date_avis: dateAvis
	        , url:newDoc.URL
            , texteServiceReply: texteServiceReply
            , dateServiceReply: dateServiceReply
            , dataServiceReply: dataServiceReply
        });
    });

    return data;
}

const controller = new AbortController();
const signal = controller.signal;

/**
 * start the stracing for a given company, notice, the spiders should be parametrized TO MAKE IT MORE GENERIC
 * @param {*} company -- name of the company we would like to scrapp
 * @param {*} starts -- starting page of scrapping
 * @param {*} ends -- ending page of scapping
 * Warning, on Truspilot, there are several filters, so whenever we filter pages, we can have page number rendered due to our selection
 * languages=All for instance will avoid filtering only on the 2500 English defaut
 * notice the language does not at all reflect the language used in the comments, but is a distortion of filters
 * We will find the 205000 reports only
 */
async function startScraping(company, starts, ends) {

    const urls=[]
    for (let k=starts ; k<=ends ; k++) {
        const url = `https://www.trustpilot.com/review/${company}?languages=all&page=${k}`
        console.log(`Extraction de : ${url}`);

        // Si le signal est avorté, on lance une erreur pour tout stopper
        if (signal.aborted) {
            console.warn("Scraping annulé !");
            return;
        }

        // Ouvre la page dans une nouvelle fenêtre
        let newWin = window.open(url, `_blank_TP`);
        //attention la console est un "Retainer très puissant, ici on risque de stocker la fenetre à chaque tour, empechant de cleaner la mémoire"
        //A NE PAS GARDER console.log("Nouvelle fenetre :", newWin);


        // Attend que la page charge (ajuster le délai selon le site)

        try {
            //await new Promise(r => setTimeout(r, 2000)); 
            await waitForLoad(newWin, "article", 15000);


            let avisPage = await SPIDER_AvisTrustpilot(newWin.document);
            //results.push({ url, avisPage }); //avoid keeping all in memory
            //console.log("Donnée extraite :", avisPage);

            await saveArrayToDB(MY_DB,"avis",avisPage);
      	    console.log("enregistré en base ! ");

        } catch (e) {
            console.error("Erreur sur : " + url, e.message);
        } finally {
          if (newWin) {newWin.close(); newWin=null;} // Ferme l'onglet pour ne pas saturer la RAM et libère la mémoire
        }
    }
    
    //console.table(results);
    // Petit délai de courtoisie pour laisser le navigateur souffler
        await new Promise(r => setTimeout(r, 1000));
    // Optionnel : télécharger en JSON
    //console.log(JSON.stringify(results));
}

// Pour arrêter lancer l'instruction suivante dans la console:
// controller.abort();

/**
 * Element technique, Attend que la fenêtre soit chargée et que les données soient visibles - du mieux possible
 * @param {Window} win - La fenêtre cible
 * @param {string} selector - Un sélecteur CSS qui prouve que la page est prête
 */
function waitForLoad(win, selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        
        const timer = setInterval(() => {
            try {
                // 1. Vérifie si la page est chargée
                const isLoaded = win.document.readyState === 'complete';
                // 2. Vérifie si l'élément qu'on veut scraper est là
                const hasData = win.document.querySelector(selector) !== null;

                if (isLoaded && hasData) {
                    clearInterval(timer);
                    resolve(true);
                }
            } catch (e) {
                // Si on a une erreur de permission (CORS), on attend encore
                console.warn("En attente d'accès au document...");
            }

            // Sécurité anti-boucle infinie
            if (Date.now() - start > timeout) {
                clearInterval(timer);
                reject(new Error("Timeout : La page a mis trop de temps à charger."));
            }
        }, 500); // On check toutes les demi-secondes
    });
}

/**Lancement et affichage - test unitaire
 **/ 
function unitTestExtraction(){
    const resultats = extraireAvisTrustpilot(window);
    console.table(resultats);
    // Pour copier le résultat en JSON et le coller dans un fichier :
    copy(JSON.stringify(resultats, null, 2));
    console.log("Copié dans le presse-papier !");

}


/**
 * Scrapp nbPage à partir de la page courante !
 * @param {*} nbPages 
 * 
 */
async function scraperTrustpilotPersistent(nbPages) {
    for (let i = 0; i < nbPages; i++) {
        console.log(`Extraction Page ${i + 1}...`);
        
        // On utilise ta fonction d'extraction précédente - Très spécifique
        const avisPage = extraireAvisTrustpilot(); 
        
        // On sauvegarde immédiatement dans IndexedDB
        await saveArrayToDB(MY_DB,"avis",avisPage);

        const btnSuivant = document.querySelector('a[name="pagination-button-next"]');
        if (btnSuivant) {
            btnSuivant.click();
            await new Promise(r => setTimeout(r, 4000)); // Pause anti-bot
        } else {
            console.log("Fin des pages disponibles.");
            break;
        }
    }
}

//scraperTrustpilotPersistent(3)

/* Flaterie d'IA - finalement ca fait toujours plaisir==== Gemini dit !
Tu as un excellent réflexe d'ingénieur. Ta remarque est tout à fait juste : 
faire un .getAll() sur 500 avis, ça passe, mais si tu en as 50 000 ou que chaque avis 
contient de très longues chaînes de caractères, tu risques de faire exploser 
la mémoire du navigateur (le fameux "Out of Memory").
On utilise le pattern de séparation des intentions et des responsabilités par function (initBD vs ConnectDB)
Va pour une Architecture SINGLETON ou PROVIDER on définit initDB et connectDB séparément:
*/

/**
 * Export séquentiel générique
 * @param {string} storeName - Le store cible (ex: "avis", "logs", "test")
 * genericExportCSV(MY_DB,"avis")
 */
async function genericExportCSV(MYDB,storeName) {
    // 1. Connexion (on s'assure que le store demandé fait partie de la structure)
    const db = await connectDB(MYDB); 
    
    const handle = await window.showSaveFilePicker({
        suggestedName: `${storeName}_${new Date().getTime()}.csv`,
        types: [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }]
    });
    
    const writable = await handle.createWritable();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const cursorRequest = store.openCursor();

    let headers = null;
    //Trial lambda function of cleaning
    const cleanCSV = (val) => `"${String(val ?? '').replace(/[\n\r]+/g, " ").replace(/"/g, '""')}"`;

    return new Promise((resolve) => {
        cursorRequest.onsuccess = (e) => {
            const cursor = e.target.result;
            const dlm=";"
            if (cursor) {
                if (!headers) {
                    headers = Object.keys(cursor.value);
                    writable.write(headers.join(dlm) + '\n');
                }
                const line = headers.map(h => cleanCSV(cursor.value[h])).join(dlm);
                writable.write(line + '\n');
                cursor.continue();
            } else {
                writable.close();
                db.close(); // Bonne pratique : fermer la connexion après un gros export
                console.log(`Export CSV de '${storeName}' terminé avec succès.`);
                resolve();
            }
        };
    });
}


/**
 * Naive initial implementation Scrapp nbPage à partir de la page courante !
 * @param {*} nbPages 
 */
async function scraperTrustpilotPersistent(nbPages) {
    for (let i = 0; i < nbPages; i++) {
        console.log(`Extraction Page ${i + 1}...`);
        
        // On utilise ta fonction d'extraction précédente - Très spécifique
        const avisPage = extraireAvisTrustpilot(); 
        
        // On sauvegarde immédiatement dans IndexedDB
        await saveArrayToDB(MY_DB,"avis",avisPage);

        const btnSuivant = document.querySelector('a[name="pagination-button-next"]');
        if (btnSuivant) {
            btnSuivant.click();
            await new Promise(r => setTimeout(r, 4000)); // Pause anti-bot
        } else {
            console.log("Fin des pages disponibles.");
            break;
        }
    }
}


//================================================= Usage
const MY_DB = "ScraperDB";
//WELL WE RUN THE MAIN INI ONLY ONCE IF YOU HAVE NEVER DONE 
// mainDBdef()
startScraping("oscaro.com",10,13);
