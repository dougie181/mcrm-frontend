/**
 * @license Copyright (c) 2014-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import ClassicEditor from "@ckeditor/ckeditor5-editor-classic/src/classiceditor.js";
import Alignment from "@ckeditor/ckeditor5-alignment/src/alignment.js";
import Autoformat from "@ckeditor/ckeditor5-autoformat/src/autoformat.js";
import BlockQuote from "@ckeditor/ckeditor5-block-quote/src/blockquote.js";
import CloudServices from "@ckeditor/ckeditor5-cloud-services/src/cloudservices.js";
import Essentials from "@ckeditor/ckeditor5-essentials/src/essentials.js";
import {
  Font,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
} from "@ckeditor/ckeditor5-font/src";
import Heading from "@ckeditor/ckeditor5-heading/src/heading.js";
import Highlight from "@ckeditor/ckeditor5-highlight/src/highlight.js";
import HorizontalLine from "@ckeditor/ckeditor5-horizontal-line/src/horizontalline.js";
import {
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  ImageResize,
  ImageResizeEditing,
  ImageInsert,
  AutoImage,
  PictureEditing,
  ImageInline,
  ImageBlock,
} from "@ckeditor/ckeditor5-image";
import { Base64UploadAdapter } from "@ckeditor/ckeditor5-upload";
import { Indent, IndentBlock } from "@ckeditor/ckeditor5-indent";
import { Link, LinkImage, AutoLink } from "@ckeditor/ckeditor5-link";
import { List } from "@ckeditor/ckeditor5-list";
import MediaEmbed from "@ckeditor/ckeditor5-media-embed/src/mediaembed.js";
import Paragraph from "@ckeditor/ckeditor5-paragraph/src/paragraph.js";
import PasteFromOffice from "@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice.js";
import SelectAll from "@ckeditor/ckeditor5-select-all/src/selectall.js";
import {
  Bold,
  Code,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "@ckeditor/ckeditor5-basic-styles";
import {
  Table,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
} from "@ckeditor/ckeditor5-table";
import TextTransformation from "@ckeditor/ckeditor5-typing/src/texttransformation.js";
import FullPage from "@ckeditor/ckeditor5-html-support/src/fullpage.js";
import { SourceEditing } from "@ckeditor/ckeditor5-source-editing";
import { Style } from "@ckeditor/ckeditor5-style";
import { GeneralHtmlSupport } from "@ckeditor/ckeditor5-html-support";

import { FindAndReplace } from "@ckeditor/ckeditor5-find-and-replace";

import Placeholder from "./placeholder/placeholder.js";

class Editor extends ClassicEditor {}

// Plugins to include in the build.
Editor.builtinPlugins = [
  Alignment,
  Autoformat,
  AutoLink,
  BlockQuote,
  Bold,
  CloudServices,
  Essentials,
  Font,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Heading,
  Highlight,
  HorizontalLine,

  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  ImageResize,
  ImageResizeEditing,
  ImageInsert,
  AutoImage,
  PictureEditing,
  ImageInline,
  ImageBlock,
  LinkImage,
  Base64UploadAdapter,

  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  // TodoList,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  SelectAll,
  Subscript,
  Superscript,
  Strikethrough,
  Code,
  Table,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TextTransformation,
  Underline,
  Placeholder,
  FullPage,
  SourceEditing,
  Style,
  GeneralHtmlSupport,
  FindAndReplace,
];

// Editor configuration.
Editor.defaultConfig = {
  toolbar: {
    items: [
      "selectAll",
      "findAndReplace",
      "|",
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      {
        label: "Font",
        withText: true,
        icon: "text",
        items: [
          "fontFamily",
          "fontSize",
          "fontColor",
          "fontBackgroundColor",
          "highlight",
        ],
      },
      "|",
      "placeholder",
      "|",
      "alignment",
      "outdent",
      "indent",
      "-",
      "bold",
      "italic",
      "underline",
      "subscript",
      "superscript",
      "blockQuote",
      "horizontalLine",
      "|",
      "bulletedList",
      "numberedList",
      "|",
      "linkImage",
      "uploadImage",
      "|",
      "insertTable",
      "mediaEmbed",
      "|",
      "sourceEditing",
    ],
    shouldNotGroupWhenFull: true,
  },
  language: "en-au",
  table: {
    contentToolbar: [
      "tableColumn",
      "tableRow",
      "mergeTableCells",
      "tableCellProperties",
      "tableProperties",
    ],
  },
  placeholderConfig: {
    types: [],
  },
  htmlSupport: {
    allow: [
      {
        name: /^.*$/,
        styles: true,
        attributes: true,
        classes: true,
      },
    ],
  },

  fontFamily: {
    supportAllValues: true,
  },
  fontSize: {
    options: [10, 12, 14, "default", 18, 20, 22],
    supportAllValues: true,
  },
  htmlEmbed: {
    showPreviews: true,
  },
  image: {
    styles: ["alignCenter", "alignLeft", "alignRight"],
    resizeOptions: [
      {
        name: "resizeImage:original",
        label: "Original",
        value: null,
        icon: "original",
      },
      {
        name: "resizeImage:25",
        label: "25%",
        value: "50",
        icon: "small",
      },
      {
        name: "resizeImage:50",
        label: "50%",
        value: "50",
        icon: "medium",
      },
      {
        name: "resizeImage:75",
        label: "75%",
        value: "75",
        icon: "medium",
      },
      {
        name: "imageResize:100",
        label: "100%",
        value: "100",
        icon: "large",
      },
    ],
    toolbar: [
      "imageTextAlternative",
      "toggleImageCaption",
      "|",
      "imageStyle:inline",
      "imageStyle:wrapText",
      "imageStyle:breakText",
      "imageStyle:side",
      "|",
      "linkImage",
      {
        name: "imageResize",
        items: [
          "imageResize:original",
          "imageResize:50",
          "imageResize:75",
          "imageResize:100",
        ],
        defaultItem: "imageResize:original",
      },
    ]
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true,
    },
  },
  link: {
    decorators: {
      addTargetToExternalLinks: true,
      defaultProtocol: "https://",
      toggleDownloadable: {
        mode: "manual",
        label: "Downloadable",
        attributes: {
          download: "file",
        },
      },
    },
  },
  mention: {
    feeds: [
      {
        marker: "@",
        feed: [
          "@apple",
          "@bears",
          "@brownie",
          "@cake",
          "@cake",
          "@candy",
          "@canes",
          "@chocolate",
          "@cookie",
          "@cotton",
          "@cream",
          "@cupcake",
          "@danish",
          "@donut",
          "@dragée",
          "@fruitcake",
          "@gingerbread",
          "@gummi",
          "@ice",
          "@jelly-o",
          "@liquorice",
          "@macaroon",
          "@marzipan",
          "@oat",
          "@pie",
          "@plum",
          "@pudding",
          "@sesame",
          "@snaps",
          "@soufflé",
          "@sugar",
          "@sweet",
          "@topping",
          "@wafer",
        ],
        minimumCharacters: 1,
      },
    ],
  },
};

export default Editor;
