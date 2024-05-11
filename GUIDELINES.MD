# INDY - Test technique

> ⚙️ [Promococde API documentation](README.MD)

## **Contexte**

Tu fais partie d'une entreprise de réservation de VTC (de type Uber) et l'équipe Marketing souhaite encourager les clients à réserver un trajet en leur proposant des promotions.

Pour cela, elle souhaite s'équiper d'un service de gestion de _promocodes_ où :

- l'équipe Marketing pourra ajouter des _promocodes_ dont la validité dépendra d'un ou plusieurs critères
- l'application pourra vérifier la validité d'un _promocode_ et obtenir la réduction associée.

> 🎯 L'objectif de cet exercice est de construire ce service avec son API.

> ℹ️ Tu peux t'aider de n'importe quels framework, librairie ou outil que tu juges utiles.

> ℹ️ Il n’y a pas de frontend à développer.

## **Spécifications**

### **Structure d'un** _promocode_

Un promocode est composé de :

- Un nom
- Un avantage (la réduction associée)
- Une ou plusieurs restrictions (les critères de validité du promocode)

Pour qu'un promocode soit validé, il faut que toutes ses restrictions soient validées.

Les restrictions sont définies par différentes règles :

- `age`
- `date`
- `meteo`
- `or`
- `and`

Les règles `or` et `and` incluent d'autres règles.

ℹ️ Une règle `or` ou `and` pouvant inclure d'autres règles `or` ou `and`, **l'arbre des restrictions peut aller jusqu'à une profondeur arbitraire**.

Voici un exemple de promocode :

```json
{
  "name": "WeatherCode",
  "advantage": { "percent": 20 },
  "restrictions": [
    {
      "date": {
        "after": "2019-01-01",
        "before": "2020-06-30"
      }
    },
    {
      "or": [
        {
          "age": {
            "eq": 40
          }
        },
        {
          "and": [
            {
              "age": {
                "lt": 30,
                "gt": 15
              }
            },
            {
              "weather": {
                "is": "clear",
                "temp": {
                  "gt": 15 // Celsius here.
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Ce promocode se lit de la manière suivante :

- Il peut être utilisé si la date d'aujourd'hui est comprise entre le 1er janvier 2019 et le 30 juin 2020.
- Il faut que le client ait :
  - soit 40 ans
  - soit qu'il ait entre 15 et 30 ans et que la température extérieure soit supérieure à 15 °C avec un soleil radieux.
- Si le client valide ces restrictions, alors il obtient une réduction de 20 % sur son trajet.

### Ajout d'un promocode

👉 Le service doit exposer une route pour ajouter un promocode.

> ℹ️ Pour la persistance des données, une implémentation basique en mémoire est suffisante.
> Pas besoin d’avoir une vraie base de données.

_Exemple de requête :_

```json
{
  "name": "WeatherCode",
  "advantage": { "percent": 20 },
  "restrictions": [
    {
      "date": {
        "after": "2019-01-01",
        "before": "2020-06-30"
      }
    },
    {
      "or": [
        {
          "age": {
            "eq": 40
          }
        },
        {
          "and": [
            {
              "age": {
                "lt": 30,
                "gt": 15
              }
            },
            {
              "weather": {
                "is": "clear",
                "temp": {
                  "gt": 15 // Celsius here.
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### **Validation d'un** _promocode_

👉 Le service doit exposer une route pour valider l'utilisation d'un promocode pour un utilisateur donné.

- En cas de promocode valide, le service retourne la réduction associée
- En cas de promocode invalide, le service retourne la liste des raisons pour lesquelles le promocode est invalide

> ℹ️ La météo de la ville est à récupérer via un service externe. Voir [**Météo**](https://www.notion.so/M-t-o-be9fa06ce0334037b1d8f84fdf3a7d1a?pvs=21)

_Exemple de requête :_

```json
{
  "promocode_name": "WeatherCode",
  "arguments": {
    "age": 25,
    "town": "Lyon"
  }
}
```

_Exemple de réponse si le promocode est validé :_

```json
{
  "promocode_name": "WeatherCode",
  "status": "accepted",
  "advantage": { "percent": 20 }
}
```

_Exemple de réponse si le promocode est invalidé :_

```json
{
  "promocode_name": "WeatherCode",
  "status": "denied",
  "reasons": [
    // Les raisons pour lesquelles le promocode n'a pas été validé
  ]
}
```

## **Évaluation**

🎯 L’objectif de cet exercice est d’avoir un aperçu de comment tu abordes un problème et comment tu codes la solution.
Fais en sorte d’avoir un code qui respecte tes standards de qualité comme s’il devait aller en production et être maintenu dans le futur.

Concentre toi sur :

- Le fonctionnement de l’algorithme
- La lisibilité et la clarté du code
- L’architecture de l’application
- L’appel à l’API pour récupérer la météo
- Les tests automatisés

Pour nous aider, pense à écrire un README pour expliquer :

- Comment lancer l’application
- Ton algorithme
- Tes choix techniques
- Les pistes d’amélioration de ton code

⚠️ Si tu as envie d’en faire plus, sois d’abord certain d’avoir bien répondu aux attentes précédentes.

Les éléments suivants sont des nice to have mais **n’interviennent pas dans notre évaluation** de cet exercice (liste non exhaustive) :

- Docker ou autre conteneurisation
- CI (continuous integration)
- Base de données (SQL, NoSQL, …)
- Swagger, Postman ou autre documentation d’API
- Authentification
- Hébergement dans le cloud
- …
