---
title: "Compute Atlas"
num: "02"
tags: ["Astro", "React", "Mapbox GL JS", "Infrastructure research"]
status: "Research preview"
featured: true
summary: "An independent research atlas connecting data center locations with power, historical grid geography, reported water use and watershed context."
---

## The question

Where are data centers, and what can public evidence tell us about the resources and infrastructure around them?

Compute Atlas brings facility locations, electricity generation, historical grid regions, water disclosures and watershed context into one map. It is intended for utilities, developers, planners and infrastructure researchers. It is an independent technical project.

[Open the live atlas](https://map.kevinclark.ai/)

## The product

The map supports facility search, resource layers, facility details, comparisons and shareable views. Its evidence register explains source dates and coverage gaps. Exports preserve those qualifications alongside the selected records.

The facility and business identity view distinguishes inherited names and operators from source-reported campus context, hosting relationships and legal property ownership. Unknown relationships remain unknown.

## Evidence as a design constraint

Different sources describe different things. An annual water disclosure can cover several buildings. A historical grid polygon does not prove a present utility connection. A planned capacity figure does not establish measured demand. A company operating a campus is not automatically the legal owner of every parcel.

Those distinctions shape both the data and the interface. The atlas labels historical boundaries, separates reported values from unknowns, and links selected claims to primary sources. Candidate campus and project associations are not presented as verified building identities.

The inherited location inventory has incomplete coverage and fields that still need verification. Before-and-after river-flow context is not a causal measure of a data center's environmental impact. The site is a research preview, not an engineering connection study or a complete national registry.

## How it is built

The application uses Astro, React and Mapbox GL JS. Static data snapshots are served with the site, and the browser handles map rendering and search. Clustering keeps dense facility areas navigable; detailed geographic context loads as needed.

Validation checks data integrity, source-register structure, geographic geometry and share-link behavior. Those checks help prevent implementation errors; they do not independently verify every source claim.

## What this work demonstrates

The project combines product definition, geographic data handling, interface design and implementation. A central part of the work is deciding what the available evidence can support and making that distinction visible to the person using the map.

[Review the atlas sources and limitations](https://map.kevinclark.ai/evidence/)
