/**
 * Functionality for the USL modal.
 *
 * @since USL 1.0.0
 *
 * @global USL_Data
 *
 * @package USL
 * @subpackage Modal
 */
var USL_Modal;
(function ($) {
    var elements = {},
        shortcodes = {},
        slide_transition = 150,
        categories_sliding = false,
        usl_modal_open = false,
        _search_timeout, search_loading;

    USL_Modal = {

        current_shortcode: '',
        output: '',
        selection: '',

        init: function () {

            this.establishElements();
            this.binds();
            this.keyboardShortcuts();
            this.preventWindowScroll();
            this.search();
            this.slidersInit();
            this.colorpickersInit();
        },

        load: function () {
        },

        resize: function () {
            this.listHeight();
        },

        establishElements: function () {
            elements.wrap = $('#usl-modal-wrap');
            elements.submit = $('#usl-modal-submit');
            elements.backdrop = $('#usl-modal-backdrop');
            elements.cancel = elements.wrap.find('.usl-modal-cancel');
            elements.close = elements.wrap.find('.usl-modal-close');
            elements.remove = $('#usl-modal-remove');
            elements.title = elements.wrap.find('.usl-modal-title');
            elements.search = elements.wrap.find('.usl-modal-search');
            elements.categories = elements.wrap.find('.usl-modal-categories');
            elements.footer = elements.wrap.find('.usl-modal-footer');
            elements.list = elements.wrap.find('.usl-modal-shortcodes');
            elements.search_input = elements.wrap.find('input[name="usl-modal-search"]');
            elements.active_shortcode = false;
            elements.last_active_shortcode = false;
        },

        binds: function () {

            // Active a shortcode
            elements.list.find('.accordion-section-title, .usl-modal-sc-title').click(function () {
                USL_Modal.activateShortcode($(this));
            });

            // Submit the form
            elements.submit.off('click').click(function (event) {
                event.preventDefault();
                USL_Modal.update();
            });

            // Remove button
            elements.remove.click(function () {
                $(document).trigger('usl-modal-remove');
            });

            // Close the form
            elements.cancel.click(function (event) {
                event.preventDefault();
                USL_Modal.close();
            });
            elements.close.click(function (event) {
                event.preventDefault();
                USL_Modal.close();
            });

            // Filter shortcodes by category
            elements.categories.find('li').click(function () {
                USL_Modal.filterByCategory($(this));
            });

            // Show advanced atts
            elements.list.find('.usl-modal-show-advanced-atts').click(function () {
                USL_Modal.toggleAdvancedAtts($(this));
                return false;
            });

            // Move categories left and right
            elements.categories.find('.usl-modal-categories-left').click(USL_Modal.moveCategoriesLeft);
            elements.categories.find('.usl-modal-categories-right').click(USL_Modal.moveCategoriesRight);
        },

        keyboardShortcuts: function () {

            $(document).keyup(function (e) {

                if (!usl_modal_open) {
                    return;
                }

                switch (e.which) {

                    // Enter
                    case 13:

                        e.preventDefault();
                        USL_Modal.update();
                        break;

                    // Escape
                    case 27:
                        USL_Modal.close();
                        break;

                    // Tab
                    case 9:

                        if (elements.search.find('input[type="text"]').is(':focus')) {

                            e.preventDefault();

                            if (elements.active_shortcode) {
                                elements.active_shortcode.find('.usl-modal-att-row').first().focus();
                            } else {

                                elements.list.find('li').each(function () {

                                    if ($(this).is(':visible')) {

                                        var $first = $(this);
                                        if ($next.length && $next.is(':visible')) {

                                            elements.active_shortcode = $first;
                                            USL_Modal.openShortcode();
                                        }
                                        return false;
                                    }
                                });
                            }
                        }
                        break;

                    // Down arrow
                    case 40:

                        e.preventDefault();

                        var $next;
                        if (!elements.active_shortcode) {

                            elements.list.find('li').each(function () {

                                if ($(this).is(':visible')) {

                                    $next = $(this);
                                    if ($next.length && $next.is(':visible')) {

                                        elements.active_shortcode = $next;
                                        USL_Modal.openShortcode();
                                    }
                                    return false;
                                }
                            });
                        } else {
                            $next = elements.active_shortcode.next();

                            if ($next.length && $next.is(':visible')) {

                                USL_Modal.closeShortcode();
                                elements.active_shortcode = $next;
                                USL_Modal.openShortcode();
                            } else {
                                elements.active_shortcode.effect('shake', {
                                    distance: 10
                                }, 200);
                            }
                        }
                        break;

                    // Up arrow
                    case 38:

                        e.preventDefault();

                        var $prev;
                        if (!elements.active_shortcode) {

                            $(elements.list.find('li').get().reverse()).each(function () {
                                //elements.list.find('li').each(function () {

                                if ($(this).is(':visible')) {

                                    $prev = $(this);
                                    if ($prev.length && $prev.is(':visible')) {

                                        elements.active_shortcode = $prev;
                                        USL_Modal.openShortcode();
                                    }
                                    return false;
                                }
                            });
                        } else {
                            $prev = elements.active_shortcode.prev();

                            if ($prev.length && $prev.is(':visible')) {

                                USL_Modal.closeShortcode();
                                elements.active_shortcode = $prev;
                                USL_Modal.openShortcode();
                            } else {
                                elements.active_shortcode.effect('shake', {
                                    distance: 10
                                }, 200);
                            }
                        }
                        break;
                    default:
                        return;
                }
            });
        },

        moveCategoriesLeft: function () {

            var $list = elements.categories.find('ul'),
                individual_width = elements.categories.find('li').width(),
                current_offset = $list.css('left') != 'auto' ? parseInt($list.css('left')) : 0;

            if (current_offset < 0 && !categories_sliding) {
                categories_sliding = true;
                $list.animate({left: current_offset + individual_width}, {
                    duration: 300,
                    complete: function () {
                        categories_sliding = false;
                    }
                });
            }
        },

        moveCategoriesRight: function () {

            var $list = elements.categories.find('ul'),
                individual_width = elements.categories.find('li').width(),
                total_width = elements.categories.find('li').length * individual_width,
                visible_width = 5 * individual_width,
                max_offset = (total_width - visible_width) * -1,
                current_offset = $list.css('left') != 'auto' ? parseInt($list.css('left')) : 0;

            if (current_offset > max_offset && !categories_sliding) {
                categories_sliding = true;

                $list.animate({left: current_offset + (individual_width * -1)}, {
                    duration: 300,
                    complete: function () {
                        categories_sliding = false;
                    }
                });
            }
        },

        initAtts: function () {

            elements.active_shortcode.find('.usl-modal-att-row').each(function () {
                var att_type = $(this).attr('data-att-type'),
                    attObj;

                // Initialize each type of att (this is as big one!)
                switch (att_type) {
                    case 'selectbox':

                        attObj = new Selectbox($(this));

                        // Apply Chosen
                        var $chosen = $(this).find('.chosen'),
                            $container = $chosen.closest('.usl-modal-att-field');

                        $chosen.chosen({
                            width: '100%',
                            search_contains: true,
                            allow_single_deselect: true,
                            disable_search: $chosen.hasClass('allow-icons')
                        });

                        // Fix scroll issue
                        $container.find('.chosen-results').bind('mousewheel', function (e) {
                            $(this).scrollTop($(this).scrollTop() - e.originalEvent.wheelDeltaY);
                            return false;
                        });

                        // Extend functionality to allow icons
                        if ($chosen.hasClass('allow-icons')) {

                            $chosen.on('chosen:showing_dropdown chosen:updated', function () {

                                $(this).find('option').each(function (index) {
                                    var icon = $(this).attr('data-icon');

                                    if (icon) {
                                        $container.find('.chosen-results li').eq(index - 1).prepend(
                                            '<span class="' + icon + '"></span>'
                                        )
                                    }
                                });
                            });

                            $chosen.on('change chosen:updated', function () {
                                var icon = 'dashicons ' + $chosen.val();

                                $container.find('.chosen-single span').prepend(
                                    '<span class="' + icon + '"></span>'
                                );
                            });
                        }

                        // Extend functionality to allow custom text input (if enabled on input)
                        // TODO Find a way to allow searching of option values as well as text
                        if ($chosen.hasClass('allow-custom-input')) {

                            $container.find('.chosen-container').addClass('allow-custom-input');

                            // When hiding the dropdown (submitting the field), use our custom input
                            $chosen.on('chosen:hiding_dropdown', function () {
                                var name = $(this).attr('name'),
                                    $self = $(this),
                                    $container = $(this).closest('.usl-modal-att-field'),
                                    custom_val = $container.find('.chosen-search input[type="text"]').val(),
                                    $custom_input = $container.find('.chosen-custom-input'),
                                    $placeholder = $container.find('.chosen-container .chosen-single');

                                // An existing value has been selected manually or there was no input
                                if (!custom_val.length) {
                                    if ($custom_input.length) {
                                        $custom_input.remove();
                                    }
                                    return;
                                }

                                // See if value exists in selectbox, and if it does, set chosen to that value
                                var exists = false;
                                $(this).find('option').each(function () {
                                    if ($(this).val() == custom_val) {
                                        $self.val(custom_val).trigger('chosen:updated');
                                        exists = true;
                                        return false;
                                    }
                                });

                                if (exists) {
                                    return;
                                }

                                if (!$custom_input.length) {
                                    $container.append('<input type="hidden" class="chosen-custom-input" name="' + name + '" />');
                                    $custom_input = $container.find('.chosen-custom-input');
                                }

                                $custom_input.val(custom_val);
                                $placeholder.removeClass('chosen-default');
                                $placeholder.find('> span').html(custom_val);
                            });
                        }
                        break;
                    case 'colorpicker':

                        attObj = new Colorpicker($(this));
                        break;
                    case 'slider':

                        attObj = new Slider($(this));
                        break;

                    case 'counter':

                        attObj = new Counter($(this));

                        var shift_down = false,
                            $input = $(this).find('.usl-modal-att-counter'),
                            $button_up = $(this).find('.usl-modal-counter-up'),
                            $button_down = $(this).find('.usl-modal-counter-down'),
                            min = parseInt($input.attr('data-min')),
                            max = parseInt($input.attr('data-max')),
                            step = parseInt($input.attr('data-step')),
                            shift_step = parseInt($input.attr('data-shift-step'));

                        // If holding shift, let us know so we can use the shift_step later
                        $(document).keydown(function (e) {
                            if (e.which === 16) {
                                shift_down = true;
                            }
                        });

                        $(document).keyup(function (e) {
                            if (e.which === 16) {
                                shift_down = false;
                            }
                        });

                        // Click on the "+"
                        $(this).find('.usl-modal-counter-up').click(function () {
                            $input.val(parseInt($input.val()) + (shift_down ? shift_step : step));
                            $input.change();
                        });

                        // Click on the "-"
                        $(this).find('.usl-modal-counter-down').click(function () {
                            $input.val(parseInt($input.val()) - (shift_down ? shift_step : step));
                            $input.change();
                        });

                        // Keep the number within its limits
                        $input.change(function () {

                            if (parseInt($(this).val()) > max) {

                                $(this).val(max);
                                $button_up.addClass('disabled');
                                $button_down.removeClass('disabled');
                            } else if (parseInt($(this).val()) < min) {

                                $(this).val(min);
                                $button_down.addClass('disabled');
                                $button_up.removeClass('disabled');
                            } else {
                                $button_up.removeClass('disabled');
                                $button_down.removeClass('disabled');
                            }
                        });

                        break;

                    case 'repeater':

                        attObj = new Repeater($(this));

                        $container = $(this).find('.usl-modal-att-field');

                        // Add a new field after on pressing the "+"
                        $container.find('.usl-modal-repeater-add').click(function () {

                            var $field = $(this).closest('.usl-modal-repeater-field'),
                                $clone = $field.clone(true);

                            $clone.find('.usl-modal-att-input').val('');
                            $clone.find('.usl-modal-repeater-remove.hidden').removeClass('hidden');

                            $field.after($clone);
                        });

                        // Delete the field on pressing the "-"
                        $container.find('.usl-modal-repeater-remove').click(function () {
                            $(this).closest('.usl-modal-repeater-field').remove();
                        });

                        break;
                    default:

                        attObj = new Textbox($(this));
                        break;
                }

                $(this).data('attObj', attObj);
            });
        },

        colorpickersInit: function () {
            elements.list.find('.usl-modal-att-colorpicker').each(function () {
                var data = $(this).data();
                $(this).wpColorPicker(data);
            });
        },

        slidersInit: function () {

            elements.list.find('.usl-modal-att-slider').each(function () {
                var $e = $(this),
                    data = $e.data(),
                    indicator = $e.siblings('.usl-modal-att-slider-value');

                data.slide = function (event, ui) {
                    indicator.val(ui.value);
                };

                indicator.change(function () {
                    $e.slider('value', $(this).val());
                });

                $e.slider(data);
            });
        },

        search: function () {

            var search_delay = 300,
                search_fade = 300;

            elements.search_input.on('keyup', function (e) {

                // Don't search for certain keys
                if (e.which == 9 || e.which == 13 || e.which == 40 || e.which == 38) {
                    return;
                }

                var search_query = $(this).val(),
                    matches = search_query.match(/[a-zA-Z0-9\s]/g);

                // Don't search if the query isn't allowed characters
                if (search_query.length && (matches === null || matches.length !== search_query.length)) {
                    USL_Modal.invalidSearch(true);
                    return;
                } else {
                    USL_Modal.invalidSearch(false);
                }

                // Don't search if empty
                if (!search_query.length) {
                    USL_Modal.clearSearch(search_fade);
                    return;
                }

                if (!search_loading) {
                    elements.list.stop().animate({opacity: 0}, search_fade);
                }

                search_loading = true;

                clearTimeout(_search_timeout);
                _search_timeout = setTimeout(function () {

                    search_loading = false;
                    elements.list.stop().animate({opacity: 1}, search_fade);
                    elements.list.scrollTop(0);
                    USL_Modal.closeShortcode();

                    elements.list.find('.usl-modal-shortcode').each(function () {
                        var title = $(this).find('.usl-modal-shortcode-title').text(),
                            description = $(this).find('.description').text(),
                            code = $(this).attr('data-code'),
                            source = $(this).attr('data-source'),
                            search_string = title + description + code + source;

                        if (search_string.toLowerCase().indexOf(search_query.toLowerCase()) < 0) {
                            $(this).hide();
                        } else {
                            $(this).show();
                        }
                    });
                }, search_delay);
            });
        },

        clearSearch: function (time) {

            time = typeof time === 'undefined' ? 0 : time;
            elements.search_input.val('');
            elements.list.find('.usl-modal-shortcode').show();
            clearTimeout(_search_timeout);
            this.closeShortcode();
            elements.list.stop().animate({opacity: 1}, time);
            search_loading = false;
        },

        invalidSearch: function (invalid) {

            var $invalidsearch = elements.wrap.find('.usl-modal-invalidsearch');

            if (invalid) {
                $invalidsearch.show();
            } else {
                $invalidsearch.hide();
            }
        },

        activateShortcode: function ($e) {

            var container = $e.closest('.usl-modal-shortcode');

            if (container.hasClass('active')) {
                this.closeShortcode();
                elements.active_shortcode = false;
                elements.last_active_shortcode = false;
                return;
            }

            this.closeShortcode();

            elements.active_shortcode = container;

            this.openShortcode();
        },

        toggleAdvancedAtts: function ($e) {
            if ($e.text() === 'Show advanced options') {
                this.showAdvancedAtts($e);
            } else {
                this.hideAdvancedAtts($e);
            }
        },

        showAdvancedAtts: function ($e) {

            var $container = $e.siblings('.usl-modal-advanced-atts');

            $container.show();
            $e.text('Hide advanced options');
        },

        hideAdvancedAtts: function ($e) {

            var $container = $e.siblings('.usl-modal-advanced-atts');

            $container.hide();
            $e.text('Show advanced options');
        },

        preventWindowScroll: function () {

            elements.list.bind('mousewheel', function (e) {

                $(this).scrollTop($(this).scrollTop() - e.originalEvent.wheelDeltaY);
                return false;
            });
        },

        filterByCategory: function ($e) {

            var category = $e.attr('data-category'),
                shortcodes = elements.list.find('li');

            // Set all other categories to inactive, and this one to active
            elements.categories.find('li').removeClass('active');
            $e.addClass('active');

            // Clear previously activated and opened items and clear forms
            this.refresh();
            this.closeShortcode();
            elements.active_shortcode = false;

            if (category === 'all') {
                shortcodes.show();
            } else {
                shortcodes.each(function () {
                    if (category !== $(this).attr('data-category')) {
                        $(this).hide();
                    } else {
                        $(this).show();
                    }
                });
            }

            this.refreshRows();
        },

        refreshRows: function () {

            var i = 0;
            elements.list.find('> li').each(function () {

                if ($(this).css('display') === 'none') {
                    return true;
                }

                if (i % 2) {
                    $(this).addClass('alt');
                } else {
                    $(this).removeClass('alt');
                }
                i++;
            })
        },

        resetScroll: function () {
            elements.list.scrollTop(0);
        },

        listHeight: function () {

            var height = elements.wrap.innerHeight()
                - elements.title.outerHeight(true)
                - elements.search.outerHeight(true)
                - elements.categories.outerHeight(true)
                - elements.wrap.find('.dashicons-leftright').outerHeight(true)
                - elements.footer.outerHeight(true);

            elements.list.height(height);
        },

        showRemoveButton: function () {
            elements.remove.show();
        },

        hideRemoveButton: function () {
            elements.remove.hide();
        },

        modify: function (shortcode) {

            // Crop off any whitespace (generally preceding)
            shortcode = shortcode.trim();

            // Get our shortcode regex (localized)
            var shortcode_regex = USL_Data.shortcode_regex;

            // Make it compatible with JS (originally in PHP)
            shortcode_regex = shortcode_regex.replace(/\*\+/g, '*');

            // Turn it into executable regex and use it on our code
            var matches = new RegExp(shortcode_regex).exec(shortcode),
                code = matches[2],
                _atts = matches[3], atts = {},
                content = matches[5];

            // Get our att pairs
            var attRegEx = /(\w+)\s*=\s*"([^"]*)"(?:\s|$)|(\w+)\s*=\s*\'([^\']*)\'(?:\s|$)|(\w+)\s*=\s*([^\s\'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|(\S+)(?:\s|$)/g,
                match;

            while (match = attRegEx.exec(_atts)) {
                atts[match[3]] = match[4];
            }

            // Add on the content
            if (content) {
                atts.content = content;
            }

            this.setActiveShortcode(code);

            this.current_shortcode = {
                all: shortcode,
                code: code,
                atts: atts
            };

            this.open();

            this.openShortcode();

            this.populateShortcode(atts);
        },

        setActiveShortcode: function (shortcode) {

            // Find our current shortcode
            elements.list.find('li').each(function () {
                if ($(this).attr('data-code') === shortcode) {
                    elements.active_shortcode = $(this);
                }
            });
        },

        populateShortcode: function (pairs) {

            elements.active_shortcode.find('.usl-modal-att-row').each(function () {

                var attObj = $(this).data('attObj');

                if (typeof pairs[attObj.name] !== 'undefined') {
                    attObj.setValue(pairs[attObj.name]);
                }
            });
        },

        closeShortcode: function () {

            if (elements.active_shortcode) {

                elements.active_shortcode.removeClass('active');
                elements.active_shortcode.find('.accordion-section-content').slideUp(slide_transition);
                USL_Modal.hideAdvancedAtts(elements.active_shortcode.find('.usl-modal-show-advanced-atts'));
                USL_Modal.refresh();
                elements.last_active_shortcode = elements.active_shortcode;
                elements.active_shortcode = false;
            }
        },

        openShortcode: function () {

            if (elements.active_shortcode) {

                // Activate it
                elements.active_shortcode.addClass('active');

                // Open it if it's an accordion
                if (elements.active_shortcode.hasClass('accordion-section')) {
                    elements.active_shortcode.find('.accordion-section-content').slideDown(slide_transition);
                }

                // Init the atts (needs to be after the accordion opening to render Chosen properly)
                if (!elements.active_shortcode.data('attsInit')) {
                    this.initAtts();
                    elements.active_shortcode.data('attsInit', true);
                }

                // Scroll it into view
                var shortcode_offset = elements.active_shortcode.position(),
                    scrollTop = elements.list.scrollTop(),
                    offset = shortcode_offset.top + scrollTop;

                // If the last activated shortcode was an accordion AND that element was above this, we need to
                // compensate the scroll for it
                if (elements.last_active_shortcode &&
                    elements.active_shortcode.position().top > elements.last_active_shortcode.position().top &&
                    elements.last_active_shortcode.hasClass('accordion-section')
                ) {
                    offset = offset - elements.last_active_shortcode.find('.accordion-section-content').outerHeight();
                }

                elements.list.stop().animate({
                    scrollTop: offset
                });
            }
        },

        open: function () {

            usl_modal_open = true;

            this.refreshRows();
            elements.wrap.show();
            elements.backdrop.show();

            elements.search.find('input[name="usl-modal-search"]').focus();

            this.listHeight();

            $(document).trigger('usl-modal-open');
        },

        close: function () {

            usl_modal_open = false;

            elements.wrap.hide();
            elements.backdrop.hide();

            this.resetScroll();
            this.closeShortcode();
            this.clearSearch();

            // Refresh categories at top
            elements.categories.find('.active').removeClass('active');
            elements.categories.find('li').first().addClass('active');
            elements.categories.find('> ul').css('left', 0);

            this.selection = '';

            $(document).trigger('usl-modal-close');
        },

        update: function () {

            var $active = elements.list.find('li.active');

            if ($active.length === 0) {
                return;
            }

            if (!this.validate()) {
                return;
            }

            this.sanitize();

            var _atts = $active.find('.usl-modal-shortcode-form').serializeArray(),
                code = $active.attr('data-code'),
                title = $active.find('.usl-modal-shortcode-title').html(),
                props, output, atts = {}, selection = this.selection;

            props = USL_Data.all_shortcodes[code];

            output = '[' + code;

            // Add on atts if they exist
            if (_atts.length) {

                // Turn it into an associative array
                for (var i = 0; i < _atts.length; i++) {

                    if (_atts[i].name.match(/:repeater/)) {

                        /*
                         Repeaters:
                         */

                        // Get the parent and child names from the input name
                        var regex = /(?:\[)([^\]]*)/g,
                            matches = [],
                            match;

                        while (match = regex.exec(_atts[i].name)) {
                            matches.push(match[1]);
                        }

                        var parent = matches[0],
                            child = matches[1];

                        // If the parent is not yet an object, create it
                        if (!atts[parent]) {
                            atts[parent] = {};
                        }

                        if (atts[parent][child]) {
                            atts[parent][child] += ',' + _atts[i].value;
                        } else {
                            atts[parent][child] = _atts[i].value;
                        }

                    } else {

                        /*
                        Everything else:
                         */

                        if (atts[_atts[i].name]) {
                            // For multi-selects
                            atts[_atts[i].name] += ',' + _atts[i].value;
                        } else {
                            atts[_atts[i].name] = _atts[i].value;
                        }
                    }
                }

                $.each(atts, function (name, value) {

                    // Set up the selection to be content if it exists
                    if (name === 'content') {
                        selection = value;
                        return true; // Continue $.each
                    }

                    // Repeaters pass objects
                    if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }

                    // Add the att to the shortcode output
                    if (value.length) {
                        output += ' ' + name + '=\'' + value + '\'';
                    }
                });
            }

            output += ']';

            if (props.wrapping) {
                output += selection + '[/' + code + ']';
            }

            this.output = {
                all: output,
                code: code,
                atts: atts,
                title: title
            };

            $(document).trigger('usl-modal-update');

            this.close();
        }
        ,

        validate: function () {

            var validated = true;

            elements.active_shortcode.find('.usl-modal-att-row').each(function () {
                var attObj = $(this).data('attObj'),
                    required = attObj.$container.attr('data-required'),
                    validate = attObj.$container.attr('data-validate'),
                    att_value = attObj.getValue(),
                    att_valid = true;

                // Basic required and field being empty
                if (required === '1' && !att_value && validated) {
                    att_valid = false;
                    validated = false;
                    attObj.setInvalid('This field is required');
                    return true; // continue $.each iteration
                } else if (!att_value) {
                    return true; //continue $.each iteration
                }

                // If there's validation, let's do it
                if (validate.length) {

                    validate = USL_Modal._stringToObject(validate);

                    $.each(validate, function (type, value) {

                        // Validate for many different types
                        switch (type) {

                            // Url validation
                            case 'url':

                                var url_pattern = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;

                                if (!att_value.match(url_pattern)) {
                                    att_valid = false;
                                    validated = false;
                                    attObj.setInvalid('Please enter a valid URL');
                                }
                                break;

                            // Email validation
                            case 'email':

                                var email_pattern = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;

                                if (!att_value.match(email_pattern)) {
                                    att_valid = false;
                                    validated = false;
                                    attObj.setInvalid('Please enter a valid Email');
                                }
                                break;

                            // Maximum character count
                            case 'maxchar':

                                if (att_value.length > parseInt(value)) {

                                    att_valid = false;
                                    validated = false;
                                    attObj.setInvalid((att_value.length - parseInt(value)) + ' too many characters.');
                                }
                                break;

                            // Minimum character count
                            case 'minchar':

                                if (att_value.length < parseInt(value)) {

                                    att_valid = false;
                                    validated = false;
                                    attObj.setInvalid((parseInt(value)) - att_value.length + ' too few characters.');
                                }
                                break;

                            // No numbers allowed
                            case 'charonly':

                                if (att_value.match(/[0-9]/)) {
                                    att_valid = false;
                                    validated = false;
                                    attObj.setInvalid('No numbers please');
                                }
                                break;

                            // Only numbers allowed
                            case 'intonly':

                                var numbers = att_value.match(/[0-9]+/);

                                if (!numbers || (numbers[0] !== numbers.input)) {
                                    att_valid = false;
                                    validated = false;
                                    attObj.setInvalid('Only numbers please');
                                }
                                break;

                            // If no matches, throw error
                            default:
                                throw new Error('USL -> Unsupported validation method "' + type + '" for the shortcode "' + attObj.shortcode + '" at field "' + attObj.fieldname + '"');
                        }
                    });
                }

                if (att_valid) {
                    attObj.setValid();
                }
            });

            return validated;
        }
        ,

        sanitize: function () {

            elements.active_shortcode.find('.usl-modal-att-row').each(function () {
                var sanitize = USL_Modal._stringToObject($(this).attr('data-sanitize')),
                    attObj = $(this).data('attObj'),
                    att_value = attObj.getValue();

                if (sanitize && att_value !== null && att_value.length) {
                    $.each(sanitize, function (type, value) {

                        switch (type) {
                            case 'url':
                                if (!att_value.match(/https?:\/\//)) {
                                    attObj.setValue('http://' + att_value);
                                }
                                break;

                            // If no matches, throw an error
                            default:
                                throw new Error('USL -> Unsupported sanitation method "' + type + '" for the shortcode "' + attObj.shortcode + '" at field "' + attObj.fieldname + '"');

                        }
                    });
                }
            });
        }
        ,

        refresh: function () {

            if (elements.active_shortcode) {

                elements.active_shortcode.find('.usl-modal-att-row').each(function () {

                    var attObj = $(this).data('attObj');

                    if (typeof attObj !== 'undefined') {
                        attObj._revert();
                    }
                });
            }
        }
        ,

        _stringToObject: function (string) {

            if (typeof string === 'undefined' || !string.length) {
                return false;
            }
            string = '"' + string.replace(/(:|,)/g, '"' + "$1" + '"') + '"';
            string = JSON.parse('{' + string + '}');
            return string;
        }
    };

    function AttAPI() {

        this.name = null;
        this.original_value = null;
        this.fieldname = null;
        this.shortcode = null;
        this.$container = null;
        this.$input = null;

        this.init = function ($e) {

            this.$container = $e;
            this.$input = this.$container.find('.usl-modal-att-input');
            this.name = $e.attr('data-att-name');
            this.fieldname = this.$container.find('.usl-modal-att-name').text().trim();
            this.shortcode = this.$container.closest('.usl-modal-shortcode').attr('data-code');

            this._storeOriginalValue();
        };

        this._storeOriginalValue = function () {

            this.original_value = this.$input.val();

            this.storeOriginalValue();
        };

        this._revert = function () {

            this.setValue(this.original_value);
            this.setValid();

            this.revert();
        };

        this.getValue = function () {
            return this.$input.val();
        };

        this.setValue = function (value) {
            this.$input.val(value);
        };

        this.setInvalid = function (msg) {
            this.$container.addClass('invalid');
            this.errorMsg(msg);
        };

        this.setValid = function () {
            this.$container.removeClass('invalid');
        };

        this.errorMsg = function (msg) {
            if (typeof this.$errormsg === 'undefined') {
                this.$errormsg = this.$container.find('.usl-modal-att-errormsg');
            }

            this.$errormsg.html(msg);
        };

        this.storeOriginalValue = function () {
        };
        this.revert = function () {
        };
    }

    var Textbox = function ($e) {

        // Extends the AttAPI object
        AttAPI.apply(this, arguments);

        this.getValue = function () {
            if (this.$input.prop('tagName') === 'textarea') {
                return this.$input.text();
            } else {
                return this.$input.val();
            }
        };

        this.init($e);
    };

    var Selectbox = function ($e) {

        // Extends the AttAPI object
        AttAPI.apply(this, arguments);

        this.setValue = function (value) {
            this.$input.val(value);
            this.$input.trigger('chosen:updated');
        };

        this.init($e);
    };

    var Colorpicker = function ($e) {

        // Extends the AttAPI object
        AttAPI.apply(this, arguments);

        this.revert = function () {
            this.$input.iris('color', this.original_value);
        };

        this.setValue = function (value) {
            this.$input.iris('color', value);
        };

        this.init($e);
    };

    var Slider = function ($e) {

        // Extends the AttAPI object
        AttAPI.apply(this, arguments);

        this.revert = function () {
            this.$slider.slider('value', this.original_value);
        };

        this.setValue = function (value) {
            this.$input.val(value);
            this.$slider.slider('value', value);
        };

        this.init($e);
        this.$slider = this.$container.find('.usl-modal-att-slider');
    };

    var Counter = function ($e) {

        // Extends the AttAPI object
        AttAPI.apply(this, arguments);

        this.init($e);
    };

    var Repeater = function ($e) {

        // FIXME Just changed markup of repeating fields to have the same markup as parent atts. Need to accomodate for this wherever it shows up

        // Extends the AttAPI object
        AttAPI.apply(this, arguments);

        this.revert = function () {

            var $fields = this.$container.find('.usl-modal-repeater-field');

            $fields.find('.usl-modal-att-input').val('');

            $fields.each(function () {
                if ($(this).index() !== 0) {
                    $(this).remove();
                }
            });
        };

        this.setValue = function (value_s) {

            if (value_s.length) {

                // If there are values to set
                var _values = JSON.parse(value_s),
                    values = {}, count = 0, all_values = [];

                $.each(_values, function (field_name, field_values) {
                    values[field_name] = field_values.split(',');
                    count = values[field_name].length;
                });

                for (var i = 0; i < count; i++) {

                    var fields = {};
                    $.each(values, function (field_name, field_values) {
                        fields[field_name] = field_values[i];
                    });
                    all_values.push(fields);
                }

                if (all_values.length) {

                    var att_name = this.$container.attr('data-att-name');

                    for (i = 0; i < all_values.length; i++) {

                        var $field = this.$container.find('.usl-modal-repeater-field').first().clone(true);

                        $.each(all_values[i], function (field, value) {
                            $field.find('.usl-modal-att-input[name="[' + att_name + '][' + field + ']:repeater"]').val(value);
                        });

                        // Show the button on all but the first
                        if (i > 0) {
                            $field.find('.usl-modal-repeater-remove.hidden').removeClass('hidden');
                        }

                        this.$container.find('.usl-modal-att-field .usl-modal-att-errormsg').before($field);
                    }

                    // Delete the first (empty) field
                    this.$container.find('.usl-modal-repeater-field').first().remove();
                }
            } else {

                // If there are no values (we are erasing)
                this.$container.find('.usl-modal-repeater-field').first().find('.usl-modal-att-input').val('');
                this.$container.find('.usl-modal-repeater-field').not(':first').remove();
            }
        };

        this.init($e);
    };

    $(function () {
        USL_Modal.init();
    });

    $(window).load(function () {
        USL_Modal.load();
    });

    $(window).resize(function () {
        USL_Modal.resize();
    });
})(jQuery);