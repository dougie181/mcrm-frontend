# mcrm-frontend
ReactJS frontend application

Table of Contents
- [mcrm-frontend](#mcrm-frontend)
- [Introduction](#introduction)
  - [Key functionality](#key-functionality)
- [Application architecture](#application-architecture)
  - [Overview](#overview)
- [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [1. Install development tools](#1-install-development-tools)
      - [Installing node](#installing-node)
      - [Installing VS Code](#installing-vs-code)
    - [2. Downloading source code](#2-downloading-source-code)
      - [Create folder to store repository](#create-folder-to-store-repository)
      - [Download from github](#download-from-github)
    - [4. Setting up Frontend](#4-setting-up-frontend)
      - [Building CKEditor](#building-ckeditor)
      - [Setup the frontend ReactJS app:](#setup-the-frontend-reactjs-app)
      - [Starting the development web server](#starting-the-development-web-server)
  - [Application folder structure](#application-folder-structure)
- [Included Library Packages](#included-library-packages)
- [License](#license)

___
# Introduction
the mcrm-frontend application is a reactJS frontend component of the larger martinCRM solution. The entire solution is a comprehensive client communication management tool specifically designed to streamline the process of managing client interactions based on email campaigns. This web-based application offers a seamless integration of client data management, email campaign facilitation, and response tracking.

## Key functionality

The following is a description of this projects key functionality

1. Ability to import client and account information from external trade / investment platforms
2. Develop rich email templates with placeholders for mail merge.
3. Create and manage email campaigns that link queries, client criteria and email templates for sending Record of Advice emails to clients.
4. Keep a history of email correspondence and other notes or information against a client
5. Track email responses as tasks that can ensure responses to clients are not forgotten.

---
# Application architecture

## Overview
The overall application is made up of two main parts
1. Backend application, that includes a backend Flask API and SQLite database 
2. The frontend ReactJS application (this project).

---
# Installation

### Prerequisites

Before you begin the building the frontend you will need to have the following:

- Node.js 14 or higher (currently 20.5.0) - recommended to use nvm to manage 
- Git installed on your system
- VS Code

### 1. Install development tools

#### Installing node

We may need various node versions over time, so it may be a good idea to install Node Version Manager (nvm) before we actually install node (see above).

To check out what node versions are already installed:
```bash
nvm ls
```

To install the latest version available:
```bash
nvm install node
```

#### Installing VS Code
1. Download Visual Studio code from website: [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. (Optional) Install Command Line Tools

   - For ease of access, you might want to install the command-line tools. This allows you to open VSCode from the terminal by typing ```code .``` from a terminal command shell.

   - After opening VSCode, press Cmd + Shift + P to open the Command Palette.
Type **shell command** in the search box, and select Install 'code' command in PATH from the list.

At this point, you should have everything you need to build the development environment.

### 2. Downloading source code

#### Create folder to store repository
From within a Terminal sessopm

```bash
cd
mkdir -p ~/git
```

#### Download from github
To acces the repository, the owner will need to grant a "Personal access token". To create a personal access token, the owner of the repo needs to:
1. login to [github.com](https://github.com)
2. from the right hand menu, choose **Settings**. 
3. At the bottom of the settings left hand menu options, select **Developer Settings**
4. Select **Personal access tokens**
5. Click **Generate new token**
6. Enter a note describing the purpose of the token
7. Select the scope of the token (e.g., full control)
8. Click **Generate token**
9. Make sure to copy your personal access token now. You won’t be able to see it again!

Using git clone:
```bash
cd ~/git
git clone https://github.com/dougie181/mcrm-frontend.git

username: <Enter your github username>
password: <Enter youe personal access token as the password>
cd mcrm-frontend
```

### 4. Setting up Frontend

#### Building CKEditor
We've used a custom version of CKEditor, so this requires installation and building before the rest of the ReactJS application.

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

Note: The backend application is required for the frontend to function properly.


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
# License

This project is licensed under the GPLv2 License - see the [LICENSE](LICENSE) file for details.
