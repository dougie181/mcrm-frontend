// placeholder/placeholderui.js

import { Plugin } from "@ckeditor/ckeditor5-core";
import {
  ViewModel,
  addListToDropdown,
  createDropdown,
} from "@ckeditor/ckeditor5-ui";
import { Collection } from "@ckeditor/ckeditor5-utils";

import BracketsIcon from './placeholder.svg';

export default class PlaceholderUI extends Plugin {
  init() {
    //console.log("CKEditor: PlaceholderUI.init was called'");
    const editor = this.editor;
    const t = editor.t;
    const placeholderNames = editor.config.get("placeholderConfig.types");

    //        const placeholderNames = [ 'date', 'first name', 'surname' ];

    // The "placeholder" dropdown must be registered among the UI components of the editor
    // to be displayed in the toolbar.
    editor.ui.componentFactory.add("placeholder", (locale) => {
      const dropdownView = createDropdown(locale);

      // Store the dropdownView and items in the plugin instance itself
      this.dropdownView = dropdownView;
      this.items = getDropdownItemsDefinitions(placeholderNames);

      // Populate the list in the dropdown with items.
      addListToDropdown(dropdownView, this.items);

      dropdownView.buttonView.set({
        // The t() function helps localize the editor. All strings enclosed in t() can be
        // translated and change when the language of the editor changes.
        label: t("Placeholder"),
        tooltip: true,
        withText: true,
				icon: BracketsIcon,
      });

      // Disable the placeholder button when the command is disabled.
      const command = editor.commands.get("placeholder");
      dropdownView.bind("isEnabled").to(command);

      // Execute the command when the dropdown item is clicked (executed).
      this.listenTo(dropdownView, "execute", (evt) => {
        editor.execute("placeholder", { value: evt.source.commandParam });
        editor.editing.view.focus();
      });

      return dropdownView;
    });
  }

	// this code is not used, but I've left it here for reference and potential later use
  updatePlaceholderNames(placeholderNames) {
    console.log("CKEditor: PlaceholderUI.updatePlaceholderNames was called");
    // Update the items
    this.items = getDropdownItemsDefinitions(placeholderNames);

    // Clear the old items and add the new items
    this.dropdownView.items.clear();
    addListToDropdown(this.dropdownView, this.items);
  }
}

function getDropdownItemsDefinitions(placeholderNames) {
  const itemDefinitions = new Collection();

  for (const name of placeholderNames) {
    const definition = {
      type: "button",
      model: new ViewModel({
        commandParam: name,
        label: name,
        withText: true,
      }),
    };

    // Add the item definition to the collection.
    itemDefinitions.add(definition);
  }

  return itemDefinitions;
}