// placeholder/placeholder.js

import { Plugin } from '@ckeditor/ckeditor5-core';

import PlaceholderEditing from './placeholderediting';
import PlaceholderUI from './placeholderui';

export default class Placeholder extends Plugin {
	
    static get requires() {
			//console.log("CKEditor: PlaceholderUI was called");
        return [ PlaceholderEditing, PlaceholderUI ];
    }

		init() {
			//console.log('CKEditor: Placeholder.init was called');
	}
}
