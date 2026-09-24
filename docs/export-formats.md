# Citation & Bibliographic Export Formats

DeepGraph AI supports standard academic export formats for integration with reference managers (Zotero, Mendeley, EndNote) and publishing systems (LaTeX, Overleaf, Word).

## Supported Export Formats

| Format | File Extension | MIME Type | Reference Systems |
|---|---|---|---|
| **BibTeX** | `.bib` | `text/plain` | LaTeX, Overleaf, BibDesk, JabRef |
| **RIS** | `.ris` | `application/x-research-info-systems` | Zotero, Mendeley, EndNote, RefWorks |
| **CSL-JSON** | `.json` | `application/json` | Citation Style Language, Zotero API |
| **APA 7th** | `.txt` | `text/plain` | Social Sciences, General Science |
| **IEEE** | `.txt` | `text/plain` | Computer Science, Electrical Engineering |
| **Chicago** | `.txt` | `text/plain` | Humanities & Literature Reviews |

## REST API Usage

### 1. Export BibTeX by Paper IDs or Workspace
```http
GET /api/v1/export/bibtex?paper_ids=p-1,p-2&workspace_id=ws-123
```

### 2. Export RIS
```http
GET /api/v1/export/ris?paper_ids=p-1
```

### 3. Get Formatted Reference String
```http
GET /api/v1/export/paper/{paper_id}/formatted?style=ieee
```
