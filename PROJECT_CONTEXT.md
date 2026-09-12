# Reconexión Consciente — Contexto del proyecto

> Documento de referencia para el desarrollo y evolución del ecosistema
> Reconexión Consciente. Debe mantenerse actualizado con las decisiones
> relevantes del proyecto.

## 1. Propósito de este documento

Este archivo es la fuente de contexto principal del proyecto.

Debe permitir que un nuevo agente de IA, desarrollador o nueva conversación
pueda comprender el estado del ecosistema sin depender del historial de una
conversación anterior.

Debe distinguir siempre entre:

- estado actual;
- decisiones ya aprobadas;
- propuestas todavía no aprobadas;
- trabajo pendiente.

No debe convertir propuestas o ideas en decisiones definitivas.

---

## 2. Marca paraguas

Nombre:

**Reconexión Consciente**

Se ha decidido prescindir, en principio, de la palabra "Escuela" como parte
del nombre principal de la marca.

La marca debe poder albergar diferentes herramientas, experiencias,
contenidos, publicaciones, talleres y proyectos futuros sin quedar limitada
a una escuela o formación.

Frase/tagline actualmente considerada válida:

**"El conocimiento que buscas ya está en ti."**

David Gil es la persona visible, autor y guía del proyecto.

Reconexión Consciente es la marca/ecosistema que conecta las distintas
experiencias.

---

## 3. Dominio y arquitectura pública

Dominio principal:

**reconexionconsciente.es**

Es el dominio canónico de la marca.

También existe:

**reconexionconsciente.com**

El dominio `.com` redirige permanentemente al `.es`.

Subdominios actuales:

- `numerologia.reconexionconsciente.es`
- `tarot.reconexionconsciente.es`
- `confluencia.reconexionconsciente.es`

Los antiguos dominios de Vercel se mantienen como infraestructura/fallback,
pero no deben ser la identidad pública principal.

---

## 4. Organización local del workspace

El workspace local es:

`ReconexionConsciente`

Su estructura actual es:

```text
ReconexionConsciente/
├── Confluencia/
├── Web/
├── Tarot/
└── NumerologiaCafe/
