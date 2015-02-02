/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*global gettext, StyledElements, Wirecloud*/

(function () {

    "use strict";

    /*************************************************************************
     * Constructor
     *************************************************************************/
    var PopUp = function PopUp(element, options) {

        StyledElements.ObjectWithEvents.call(this, ['close']);
        this.element = element;
        this.options = options;

        if (options.highlight === true) {
            if (element instanceof StyledElements.StyledElement) {
                element.addClassName('tuto_highlight');
            } else {
                element.classList.add('tuto_highlight');
            }
        }

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = 'popup alert alert-info';

        // Close button
        if (options.closable) {
            this.cancelButton = new StyledElements.StyledButton({
                'class': 'button icon-remove',
                'plain': true
            });

            this.cancelButton.addEventListener('click', function () {
                this.destroy();
                this.events.close.dispatch(this);
            }.bind(this));
            this.cancelButton.insertInto(this.wrapperElement);
        }

        // Message
        this.textElement = document.createElement("div");
        if (options.msg == null) {
            this.wrapperElement.classList.add("empty");
        } else {
            this.textElement.innerHTML = options.msg;
        }

        // Warning
        this.warningIco = document.createElement("span");
        this.warningIco.className = 'warningIco icon-warning-sign';
        this.wrapperElement.appendChild(this.warningIco);

        this.wrapperElement.appendChild(this.textElement);

        // Arrow
        this.arrow = document.createElement("div");
        this.arrow.className = "popUpArrowDiv icon-hand-up";
        this.wrapperElement.appendChild(this.arrow);

        this.arrow.classList.add(options.position);
    };
    PopUp.prototype = new StyledElements.ObjectWithEvents();

    PopUp.prototype.repaint = function repaint() {
        // Position
        var pos = this.element.getBoundingClientRect();
        var wrapperPos = this.wrapperElement.getBoundingClientRect();
        switch (this.options.position) {
        default:
        case 'downRight':
            this.wrapperElement.style.top = (pos.top + pos.height + 22) + 'px';
            this.wrapperElement.style.left = (pos.left + pos.width + 22) + 'px';
            this.arrow.style.top = '-28px';
            this.arrow.style.left = '-19px';
            break;
        case 'downLeft':
            this.wrapperElement.style.top = (pos.top + pos.height + 22) + 'px';
            this.wrapperElement.style.left = (pos.left - wrapperPos.width - 22) + 'px';
            this.arrow.style.top = '-24px';
            this.arrow.style.right = '-24px';
            break;
        case 'topRight':
            this.wrapperElement.style.top = (pos.top - wrapperPos.height - 22) + 'px';
            this.wrapperElement.style.left = (pos.left + pos.width + 20) + 'px';
            this.arrow.style.top = (wrapperPos.height - 16) + 'px';
            this.arrow.style.left = '-23px';
            break;
        case 'topLeft':
            this.wrapperElement.style.top = (pos.top - wrapperPos.height - 22) + 'px';
            this.wrapperElement.style.left = (pos.left - wrapperPos.width - 31) + 'px';
            this.arrow.style.top = (wrapperPos.height - 12) + 'px';
            this.arrow.style.right = '-27px';
            break;
        }
    };

    /**
     * Destroy
     */
    PopUp.prototype.destroy = function destroy() {
        if (this.wrapperElement == null) {
            return;
        }

        if (this.options.highlight) {
            if (this.element instanceof StyledElements.StyledElement) {
                this.element.removeClassName('tuto_highlight');
            } else {
                this.element.classList.remove('tuto_highlight');
            }
        }
        if (this.wrapperElement.parentNode) {
            this.wrapperElement.parentNode.removeChild(this.wrapperElement);
        }
        this.wrapperElement = null;
        this.textElement = null;
        this.arrow = null;
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.PopUp = PopUp;


    var WidgetElement = function WidgetElement(widget, element) {
        this.widget = widget;
        this.element = element;
        this.classList = {
            'add': function () {
                this.add.apply(this, arguments);
            }.bind(this.element.classList),
            'remove': function () {
                this.remove.apply(this, arguments);
            }.bind(this.element.classList)
        };

        Object.freeze(this.classList);
        Object.freeze(this);
    };

    WidgetElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
        var widget_box = this.widget.content.getBoundingClientRect();
        var element_box = this.element.getBoundingClientRect();

        return {
            'left': widget_box.left + element_box.left,
            'top': widget_box.top + element_box.top,
            'width': element_box.width,
            'height': element_box.height
        };
    };

    WidgetElement.prototype.addEventListener = function () {
        this.element.addEventListener.apply(this.element, arguments);
    };

    WidgetElement.prototype.removeEventListener = function () {
        this.element.removeEventListener.apply(this.element, arguments);
    };

    Wirecloud.ui.Tutorial.WidgetElement = WidgetElement;

})();
