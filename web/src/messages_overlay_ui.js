import $ from "jquery";

export function row_with_focus(context) {
    const focused_item = $(`.${CSS.escape(context.box_item_selector)}:focus`)[0];
    return $(focused_item).parent(`.${CSS.escape(context.row_item_selector)}`);
}

export function activate_element(elem, context) {
    $(`.${CSS.escape(context.box_item_selector)}`).removeClass("active");
    $(elem).expectOne().addClass("active");
    elem.focus();
}

export function get_focused_element_id(context) {
    return row_with_focus(context).attr(context.id_attribute_name);
}

export function focus_on_sibling_element(context) {
    const $next_row = row_after_focus(context);
    const $prev_row = row_before_focus(context);
    let elem_to_be_focused_id;

    // Try to get the next item in the list and 'focus' on it.
    // Use previous item as a fallback.
    if ($next_row[0] !== undefined) {
        elem_to_be_focused_id = $next_row.attr(context.id_attribute_name);
    } else if ($prev_row[0] !== undefined) {
        elem_to_be_focused_id = $prev_row.attr(context.id_attribute_name);
    }

    const new_focus_element = get_element_by_id(elem_to_be_focused_id, context);
    if (new_focus_element[0] !== undefined) {
        activate_element(new_focus_element[0].children[0], context);
    }
}

export function modals_handle_events(e, event_key, context) {
    initialize_focus(event_key, context);

    // This detects up arrow key presses when the overlay
    // is open and scrolls through.
    if (event_key === "up_arrow" || event_key === "vim_up") {
        scroll_to_element(row_before_focus(context), context);
    }

    // This detects down arrow key presses when the overlay
    // is open and scrolls through.
    if (event_key === "down_arrow" || event_key === "vim_down") {
        scroll_to_element(row_after_focus(context), context);
    }

    if (event_key === "backspace" || event_key === "delete") {
        context.on_delete();
    }

    if (event_key === "enter") {
        context.on_enter();
    }
}

export function set_initial_element(element_id, context) {
    if (element_id) {
        const current_element = get_element_by_id(element_id, context);
        const focus_element = current_element[0].children[0];
        activate_element(focus_element, context);
        $(`.${CSS.escape(context.items_list_selector)}`)[0].scrollTop = 0;
    }
}

function row_before_focus(context) {
    const $focused_row = row_with_focus(context);
    const $prev_row = $focused_row.prev(`.${CSS.escape(context.row_item_selector)}:visible`);
    // The draft modal can have two sub-sections. This handles the edge case
    // when the user moves from the second "Other drafts" section to the first
    // section which contains drafts from a particular narrow.
    if (
        $prev_row.length === 0 &&
        $focused_row.parent().attr("id") === "other-drafts" &&
        $("#drafts-from-conversation").is(":visible")
    ) {
        return $($("#drafts-from-conversation").children(".draft-row:visible").last());
    }

    return $prev_row;
}

function row_after_focus(context) {
    const $focused_row = row_with_focus(context);
    const $next_row = $focused_row.next(`.${CSS.escape(context.row_item_selector)}:visible`);
    // The draft modal can have two sub-sections. This handles the edge case
    // when the user moves from the first section (drafts from a particular
    // narrow) to the second section which contains the rest of the drafts.
    if (
        $next_row.length === 0 &&
        $focused_row.parent().attr("id") === "drafts-from-conversation" &&
        $("#other-drafts").is(":visible")
    ) {
        return $("#other-drafts").children(".draft-row:visible").first();
    }
    return $next_row;
}

function initialize_focus(event_name, context) {
    // If an item is not focused in modal, then focus the last item
    // if up_arrow is clicked or the first item if down_arrow is clicked.
    if (
        (event_name !== "up_arrow" && event_name !== "down_arrow") ||
        $(`.${CSS.escape(context.box_item_selector)}:focus`)[0]
    ) {
        return;
    }

    const modal_items_ids = context.get_items_ids();
    if (modal_items_ids.length === 0) {
        // modal is empty
        return;
    }

    let element;

    function get_last_element() {
        const last_id = modal_items_ids.at(-1);
        return get_element_by_id(last_id, context);
    }

    function get_first_element() {
        const first_id = modal_items_ids[0];
        return get_element_by_id(first_id, context);
    }

    if (event_name === "up_arrow") {
        element = get_last_element();
    } else if (event_name === "down_arrow") {
        element = get_first_element();
    }
    const focus_element = element[0].children[0];
    activate_element(focus_element, context);
}

function scroll_to_element($element, context) {
    if ($element[0] === undefined) {
        return;
    }
    if ($element[0].children[0] === undefined) {
        return;
    }
    activate_element($element[0].children[0], context);

    const $items_list = $(`.${CSS.escape(context.items_list_selector)}`);
    const $items_container = $(`.${CSS.escape(context.items_container_selector)}`);
    const $box_item = $(`.${CSS.escape(context.box_item_selector)}`);

    // If focused element is first, scroll to the top.
    if ($box_item.first()[0].parentElement === $element[0]) {
        $items_list[0].scrollTop = 0;
    }

    // If focused element is last, scroll to the bottom.
    if ($box_item.last()[0].parentElement === $element[0]) {
        $items_list[0].scrollTop = $items_list[0].scrollHeight - $items_list.height();
    }

    // If focused element is cut off from the top, scroll up halfway in modal.
    if ($element.position().top < 55) {
        // 55 is the minimum distance from the top that will require extra scrolling.
        $items_list[0].scrollTop -= $items_list[0].clientHeight / 2;
    }

    // If focused element is cut off from the bottom, scroll down halfway in modal.
    const dist_from_top = $element.position().top;
    const total_dist = dist_from_top + $element[0].clientHeight;
    const dist_from_bottom = $items_container[0].clientHeight - total_dist;
    if (dist_from_bottom < -4) {
        // -4 is the min dist from the bottom that will require extra scrolling.
        $items_list[0].scrollTop += $items_list[0].clientHeight / 2;
    }
}

function get_element_by_id(id, context) {
    return $(`[${context.id_attribute_name}='${id}']`);
}
