# mcrm-frontend
ReactJS frontend application

Table of Contents
- [mcrm-frontend](#mcrm-frontend)
- [Introduction](#introduction)
  - [Key Functionality](#key-functionality)
- [Application Architecture](#application-architecture)
  - [Overview](#overview)
  - [Back to top](#back-to-top)
- [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [1. Install Development Tools](#1-install-development-tools)
      - [Installing Node](#installing-node)
      - [Installing VS Code](#installing-vs-code)
    - [2. Downloading source code](#2-downloading-source-code)
      - [Create folder to store repository](#create-folder-to-store-repository)
      - [Cloning the Repository](#cloning-the-repository)
    - [4. Setting up Frontend](#4-setting-up-frontend)
      - [Building CKEditor](#building-ckeditor)
      - [Setup the frontend ReactJS app:](#setup-the-frontend-reactjs-app)
      - [Starting the development web server](#starting-the-development-web-server)
  - [Application folder structure](#application-folder-structure)
  - [Back to top](#back-to-top-1)
- [Included Library Packages](#included-library-packages)
- [Contributing](#contributing)
- [License](#license)

___
# Introduction

The `mcrm-frontend` is a ReactJS frontend component of the martinCRM solution, a comprehensive client communication management tool. It streamlines the process of managing client interactions based on email campaigns. This web-based application integrates client data management, email campaign facilitation, and response tracking.

## Key Functionality

The key features of the `mcrm-frontend` application include:

1. Importing client and account information from external trade/investment platforms.
2. Developing rich email templates with placeholders for mail merge.
3. Creating and managing email campaigns that link queries, client criteria, and templates for sending Record of Advice emails to clients.
4. Maintaining a history of email correspondence and notes for each client.
5. Tracking email responses as tasks to ensure timely responses to clients.

---
# Application Architecture

## Overview

The martinCRM application consists of two main parts:

1. **Backend**: A Flask API with a SQLite database.
2. **Frontend**: A ReactJS application (this project).

[Back to top](#mcrm-frontend)
---
# Installation

### Prerequisites

Ensure you have the following installed before proceeding:

- [Node.js](https://nodejs.org/) version 14 or higher (recommended: use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions).
- [Git](https://git-scm.com/) installed on your system.
- [Visual Studio Code](https://code.visualstudio.com/).

### 1. Install Development Tools

#### Installing Node

To manage Node.js versions, it’s recommended to install Node Version Manager (nvm). After installing `nvm`, you can check your installed node versions with:

```bash
nvm ls
nvm install node
```

#### Installing VS Code
1.	Download Visual Studio Code from the official website.
2.	(Optional) Install Command Line Tools:
	•	Open VS Code, press Cmd + Shift + P (Mac) or Ctrl + Shift + P (Windows) to open the Command Palette.
	•	Search for “shell command” and select Install 'code' command in PATH.

This allows you to open VS Code directly from the terminal using ```code .```

### 2. Downloading source code

#### Create folder to store repository
From within a Terminal session

```bash
cd
mkdir -p ~/git
```

#### Cloning the Repository
You’ll need a “Personal Access Token” from GitHub to access the repository. The repository owner will grant this access. Once you have the token, clone the repository:

```bash
cd ~/git
git clone https://github.com/dougie181/mcrm-frontend.git
cd mcrm-frontend
```

### 4. Setting up Frontend

#### Building CKEditor
We use a custom build of CKEditor to meet the specific needs of this project. You need to install and build it before setting up the rest of the ReactJS app.

```bash
cd ckeditor-custom-build
npm install
npm run build
npm pack
```
For additional information on CKEditor, visit [CKEditor Framework](https://ckeditor.com/docs/ckeditor5/latest/framework/index.html) documentation

#### Setup the frontend ReactJS app:

```bash
cd ..
npm install
echo "VITE_API_BASE_URL=http://localhost:5001/api" > .env
```

#### Starting the development web server
```bash
npm run dev
```
We are done!

> **Note**: The backend application is required for the frontend to function properly.


## Application folder structure
		
Here is the application solution folder structure:
```plaintext
# ReactJS front end web application
├── ckeditor-custom-build/    # CKEditor custom build
├── src/                      # React source files
├── build/                    # React build files for production / testing
│   ├── static/    
│   │   ├── css/    
│   │   ├── js/    
│   ├── favicon.ico            
│   └── index.html             
├── package.json
├── .env                      # holds the Flask API base address 
├── ...
│
└── README.md                         # this file
```
[Back to top](#mcrm-frontend)
---
# Included Library Packages

The following libraries and packages are used in this project:

- `@ckeditor/ckeditor5-react`: CKEditor 5 rich-text editor integration for React.
- `@emotion/react`: Library for writing CSS styles with JavaScript.
- `@emotion/styled`: Styled components for `@mui/material`.
- `@mui/icons-material`: Material UI icons for React.
- `@mui/lab`: Material UI lab components for experimental features.
- `@mui/material`: Material UI React components for faster and easier web development.
- `@mui/x-data-grid`: Data grid for displaying and editing data in a table format.
- `@mui/x-date-pickers`: Date pickers for selecting dates and times.
- `@testing-library/jest-dom`: Custom Jest matchers for testing DOM nodes.
- `@testing-library/react`: Simple and complete testing utilities for React.
- `@testing-library/user-event`: Fire events and simulate user interaction in tests.
- `@uiw/codemirror-extensions-langs`: Language extensions for CodeMirror.
- `@uiw/react-codemirror`: Code editor component for React.
- `axios`: Promise-based HTTP client for the browser and Node.js.
- `ckeditor5-custom-build`: Custom CKEditor 5 build tailored to the project’s needs.
- `date-fns`: Modern JavaScript date utility library.
- `dayjs`: Minimalist JavaScript library for parsing, validating, manipulating, and displaying dates.
- `dompurify`: Sanitizes HTML and prevents XSS attacks.
- `file-saver`: Client-side file saving utility.
- `js-beautify`: Beautifies JavaScript, HTML, CSS files.
- `re-resizable`: Resizable component for React.
- `react`: JavaScript library for building user interfaces.
- `react-dom`: React package for working with the DOM.
- `react-dropzone`: Simple HTML5 drag-and-drop zone for files.
- `react-grid-layout`: A draggable and resizable grid layout for React.
- `react-hook-form`: Simple form validation with React hooks.
- `react-resizable`: Resizable component that supports dynamic resizing.
- `react-router-dom`: Declarative routing for React applications.
- `xlsx`: SheetJS library for parsing and writing spreadsheet files.

---
# Contributing

We welcome contributions to improve this project. To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Submit a pull request for review.

---
# License

This project is licensed under the GPLv2 License - see the [LICENSE](LICENSE) file for details.

[Back to top](#mcrm-frontend)