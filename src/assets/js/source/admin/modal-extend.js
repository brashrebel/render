/**
 * Mimics how other plugins should extend the Modal.
 *
 * @since Render 1.0.0
 *
 * @package Render
 */
(function ($) {

    /*
     * Accordion section use content in first repeater textarea
     */
    window['accordionUseContentInit'] = function ($attRow, attObj) {

        // If there's only one field, put the selected content in
        if ($attRow.closest('.render-modal-repeater-field').siblings('.render-modal-repeater-field').not('.dummy-field').length == 0) {
            attObj.setValue(Render_Modal.selection);
        }
    };

    /*
     * Extend the slider to a time format
     */

    window['timeSliderInit'] = function ($attRow, attObj) {

        // Initialize the values to be in a time format
        var ui = {},
            $input = $attRow.find('.render-modal-att-slider-value');
        ui.values = $input.val().split('-');

        timeSlider(null, ui, $input);

        // Attach the timeSlider function to the setValue method of the attObj
        attObj.setValue = function (value) {

            // The original method content
            this.$input.val(value);
            this.$input.change();

            // Our new bind
            var ui = {};
            ui.values = value.split('-');
            timeSlider(null, ui, this.$input);
        }
    };

    window['timeSlider'] = function (event, ui, $input) {

        function translateTime(value) {

            // Convert to time
            var hours = Math.floor(value / 60),
                minutes = ('00' + (value - (hours * 60))).slice(-2),
                meridiem = hours >= 12 ? 'PM' : 'AM';

            // Midnight (0) is 12
            hours = hours == 0 ? 12 : hours;

            // Over 12 converts back to under 12
            hours = hours > 12 ? hours - 12 : hours;

            return hours + ':' + minutes + meridiem;
        }

        var overlap = false;

        // Prevent overlap
        if (ui.values[0] >= ui.values[1] || ui.values[1] <= ui.values[0]) {

            var values = $input.val();
            ui.values = values.split('-');

            overlap = true;
        }

        // Output the ranges to the text and the input
        var $text = $input.siblings('.render-modal-att-slider-range-text');

        $text.find('.render-modal-att-slider-range-text-value1').html(translateTime(ui.values[0]));
        $text.find('.render-modal-att-slider-range-text-value2').html(translateTime(ui.values[1]));

        $input.val(ui.values[0] + '-' + ui.values[1]);

        if (overlap) {
            return false;
        }
    };
})(jQuery);