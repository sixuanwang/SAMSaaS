(function () {
 
    "use strict";

/******************************************************************************/
/********************************* PUBLIC *************************************/
/******************************************************************************/

    var InputBox = function InputBox() {
        this.textPreference = "";

        MashupPlatform.widget.context.registerCallback(function (newValues) {
            if ("heightInPixels" in newValues) {
                repaint.call(this);
            }
        }.bind(this));

        MashupPlatform.prefs.registerCallback(handlerPref.bind(this));
    };
 
    InputBox.prototype.init = function init() {
        // Create South Layout:
        this.layout = new StyledElements.HorizontalLayout();
        this.layout.addClassName('input');
        this.layout.addClassName('input-prepend');
        this.layout.addClassName('input-append');

        // Add Label to left of SouthLayout:
        this.textLabel = new StyledElements.Addon({text: MashupPlatform.prefs.get('input_label_pref')});
        this.layout.getWestContainer().appendChild(this.textLabel);

        // Add TextInput to center of SouthLayout:
        this.textInput = new StyledElements.StyledTextField({
            'id': 'input',
            'placeholder': MashupPlatform.prefs.get('input_placeholder_pref')
        });
        this.layout.getCenterContainer().appendChild(this.textInput);
        this.textLabel.assignInput(this.textInput);

        // Add Send Button to right of South Layout:
        this.sendButton = new StyledElements.StyledButton({
            id: 'send',
            'class': 'btn-primary',
            text: MashupPlatform.prefs.get('button_label_pref')
        });
        this.sendButton.disable();
        this.layout.getEastContainer().appendChild(this.sendButton);

        // Add handlers:
        this.textInput.addEventListener('change',  function (input) {
            this.sendButton.setDisabled(input.getValue().trim().length === 0);
        }.bind(this));
        this.textInput.addEventListener('submit', function (input) {
            if (input.getValue().trim().length !== 0) {
                sendKeyword.call(this);
            }
        }.bind(this));
        this.sendButton.addEventListener('click', sendKeyword.bind(this));

        this.layout.insertInto(document.body);
    };

/******************************************************************************/
/******************************** PRIVATE *************************************/
/******************************************************************************/

    var repaint = function repaint() {
        if (this.layout) {
            this.layout.repaint();
        }
    };

    /******************************** HANDLERS ************************************/

    var handlerPref = function handlerPref(preferences) {

        if ('input_label_pref' in preferences) {
            this.textLabel.setLabel(preferences.input_label_pref);
        }

        if ('input_placeholder_pref' in preferences) {
            this.textInput.setPlaceholder(preferences.input_placeholder_pref);
        }

        if ('button_label_pref' in preferences) {
            this.sendButton.setLabel(preferences.button_label_pref);
        }

        repaint.call(this);
    };

    var sendKeyword = function sendKeyword() {
        MashupPlatform.wiring.pushEvent("outputKeyword", this.textInput.getValue());
        this.textInput.setValue('');
        this.sendButton.disable();
    };

    window.InputBox = InputBox;

})();
