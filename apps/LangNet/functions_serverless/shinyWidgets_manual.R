switchInput <- function (inputId, label = NULL, value = FALSE, onLabel = "ON", 
                     offLabel = "OFF", onStatus = NULL, offStatus = NULL, size = "default", 
                     labelWidth = "auto", handleWidth = "auto", disabled = FALSE, 
                     inline = FALSE, width = NULL) 
{
  value <- shiny::restoreInput(id = inputId, default = value)
  size <- match.arg(arg = size, choices = c("default", "mini", 
                                            "small", "normal", "large"))
  switchProps <- dropNulls(list(id = inputId, type = "checkbox", 
                                class = "sw-switchInput", `data-input-id` = inputId, 
                                `data-on-text` = onLabel, `data-off-text` = offLabel, 
                                `data-label-text` = label, `data-on-color` = onStatus, 
                                `data-off-color` = offStatus, `data-label-width` = labelWidth, 
                                `data-handle-width` = handleWidth, disabled = if (!disabled) NULL else disabled, 
                                `data-size` = if (size == "default") "" else size))
  switchProps <- lapply(switchProps, function(x) {
    if (identical(x, TRUE)) 
      "true"
    else if (identical(x, FALSE)) 
      "false"
    else x
  })
  inputTag <- do.call(htmltools::tags$input, switchProps)
  if (!is.null(value) && value) 
    inputTag$attribs$checked <- "checked"
  switchInputTag <- htmltools::tags$div(class = "form-group shiny-input-container", 
                                        class = if (inline) 
                                          "shiny-input-container-inline", style = if (inline) 
                                            "display: inline-block;", style = css(width = validateCssUnit(width)), 
                                        inputTag)
  switchInputTag <- attachDependencies(switchInputTag, htmltools::findDependencies(tagList(label, 
                                                                                           offLabel, onLabel)))
  attachShinyWidgetsDep(switchInputTag, "bsswitch")
}


pickerInput <- function (inputId, label = NULL, choices, selected = NULL, multiple = FALSE, 
                         options = list(), choicesOpt = NULL, width = NULL, inline = FALSE, 
                         stateInput = TRUE, autocomplete = FALSE) 
{
  choices <- choicesWithNames(choices)
  selected <- restoreInput(id = inputId, default = selected)
  if (!is.null(options) && length(options) > 0) 
    names(options) <- paste("data", names(options), sep = "-")
  if (!is.null(width)) 
    options <- c(options, list(`data-width` = width))
  if (!is.null(width) && width %in% c("fit")) 
    width <- NULL
  options <- lapply(options, function(x) {
    if (identical(x, TRUE)) 
      "true"
    else if (identical(x, FALSE)) 
      "false"
    else x
  })
  maxOptGroup <- options[["data-max-options-group"]]
  options[["data-state-input"]] <- ifelse(isTRUE(stateInput), 
                                          "true", "false")
  selectTag <- tag("select", dropNulls(options))
  selectTag <- tagAppendAttributes(tag = selectTag, id = inputId, 
                                   class = "selectpicker form-control", autocomplete = if (autocomplete) 
                                     "on"
                                   else "off")
  selectTag <- tagAppendChildren(tag = selectTag, pickerSelectOptions(choices, 
                                                                      selected, choicesOpt, maxOptGroup))
  if (multiple) 
    selectTag$attribs$multiple <- "multiple"
  pickerTag <- tags$div(class = "form-group shiny-input-container", 
                        class = if (isTRUE(inline)) 
                          "shiny-input-container-inline", style = css(width = validateCssUnit(width)), 
                        style = if (isTRUE(inline)) 
                          "display: inline-block;", tagAppendAttributes(label_input(inputId, 
                                                                                    label), style = if (isTRUE(inline)) 
                                                                                      "display: inline-block;", ), selectTag)
  attachShinyWidgetsDep(pickerTag, "picker")
}

dropNulls <- function(x) {
  x[!vapply(x, is.null, FUN.VALUE = logical(1))]
}

attachShinyWidgetsDep <- function(tag, widget = NULL, extra_deps = NULL) {
  dependencies <- html_dependency_shinyWidgets()
  if (!is.null(widget)) {
    if (widget == "picker") {
      dependencies <- list(
        dependencies,
        # htmltools::htmlDependencies(shiny::fluidPage())[[1]],
        html_dependency_picker()
      )
    } else if (widget == "awesome") {
      dependencies <- list(
        dependencies,
        html_dependency_awesome(),
        htmltools::findDependencies(shiny::icon("rebel"))[[1]]
      )
    } else if (widget == "bsswitch") {
      dependencies <- c(
        list(dependencies),
        html_dependency_bsswitch()
      )
    } else if (widget == "multi") {
      dependencies <- list(
        dependencies,
        html_dependency_multi()
      )
    } else if (widget == "jquery-knob") {
      dependencies <- list(
        dependencies,
        html_dependency_knob()
      )
    } else if (widget == "dropdown") {
      dependencies <- list(
        dependencies,
        htmltools::htmlDependency(
          name = "dropdown-patch",
          version = "0.8.3",
          src = c(href = "shinyWidgets/dropdown"),
          script = "dropdown-click.js"
        )
      )
    } else if (widget == "sw-dropdown") {
      dependencies <- list(
        dependencies,
        htmltools::htmlDependency(
          name = "sw-dropdown",
          version = "0.8.3",
          src = c(href = "shinyWidgets/sw-dropdown"),
          script = "sw-dropdown.js",
          stylesheet = "sw-dropdown.css"
        )
      )
    } else if (widget == "animate") {
      dependencies <- list(
        dependencies,
        html_dependency_animate()
      )
    } else if (widget == "bttn") {
      dependencies <- list(
        dependencies,
        html_dependency_bttn()
      )
    } else if (widget == "spectrum") {
      dependencies <- list(
        dependencies,
        html_dependency_spectrum()
      )
    } else if (widget == "pretty") {
      dependencies <- list(
        dependencies,
        html_dependency_pretty()
      )
    } else if (widget == "nouislider") {
      dependencies <- list(
        dependencies,
        html_dependency_nouislider()
      )
    } else if (widget == "airdatepicker") {
      dependencies <- list(
        dependencies,
        html_dependency_airdatepicker()
      )
    }
    dependencies <- c(dependencies, extra_deps)
  } else {
    dependencies <- c(list(dependencies), extra_deps)
  }
  htmltools::attachDependencies(
    x = tag,
    value = dependencies,
    append = TRUE
  )
}


html_dependency_shinyWidgets <- function() {
  htmltools::htmlDependency(
    name = "shinyWidgets",
    version = "0.8.3",
    src = c(href = "shinyWidgets", file = "assets"),
    package = "shinyWidgets",
    script = "shinyWidgets-bindings.min.js",
    stylesheet = "shinyWidgets.min.css",
    all_files = FALSE
  )
}

html_dependency_bsswitch <- function() {
  list(
    bslib::bs_dependency_defer(bsswitchDependencyCSS),
    htmlDependency(
      name = "bootstrap-switch-js",
      version = "3.3.4",
      package = "shinyWidgets",
      src = c(href = "shinyWidgets/bootstrap-switch", file = "assets/bootstrap-switch"),
      script = "bootstrap-switch-3.3.4/bootstrap-switch.min.js"
    )
  )
}


bsswitchDependencyCSS <- function(theme) {
  if (!bslib::is_bs_theme(theme)) {
    return(htmlDependency(
      name = "bootstrap-switch-css",
      version = "3.3.4",
      package = "shinyWidgets",
      src = c(href = "shinyWidgets/bootstrap-switch", file = "assets/bootstrap-switch"),
      script = "bootstrap-switch-3.3.4/bootstrap-switch.min.js",
      stylesheet = "bootstrap-switch-3.4/bootstrap-switch.min.css"
    ))
  }
  
  if (identical(bslib::theme_version(theme), "3")) {
    sass_vars <- list(
      "primary" = "$brand-primary",
      "info" = "$brand-info",
      "success" = "$brand-success",
      "warning" = "$brand-warning",
      "danger" = "$brand-danger",
      "secondary" = "$gray-base"
    )
  } else {
    sass_vars <- list()
  }
  sass_input <- list(
    sass_vars,
    sass::sass_file(
      system.file(package = "shinyWidgets", "assets/bootstrap-switch/bootstrap-switch-3.4/bootstrap-switch.scss")
    )
  )
  
  bslib::bs_dependency(
    input = sass_input,
    theme = theme,
    name = "bootstrap-switch-css",
    version = "3.4",
    cache_key_extra = "0.8.3"
  )
}


choicesWithNames <- function(choices) {
  listify <- function(obj) {
    makeNamed <- function(x) {
      if (is.null(names(x)))
        names(x) <- character(length(x))
      x
    }
    res <- lapply(obj, function(val) {
      if (is.list(val))
        listify(val)
      else if (length(val) == 1 && is.null(names(val)))
        as.character(val)
      else makeNamed(as.list(val))
    })
    makeNamed(res)
  }
  choices <- listify(choices)
  if (length(choices) == 0)
    return(choices)
  choices <- mapply(choices, names(choices), FUN = function(choice,
                                                            name) {
    if (!is.list(choice))
      return(choice)
    if (name == "")
      stop("All sub-lists in \"choices\" must be named.")
    choicesWithNames(choice)
  }, SIMPLIFY = FALSE)
  missing <- names(choices) == ""
  names(choices)[missing] <- as.character(choices)[missing]
  choices
}

pickerSelectOptions <- function(choices, selected = NULL, choicesOpt = NULL, maxOptGroup = NULL) {
  if (is.null(choicesOpt) & is.null(maxOptGroup)) {
    return(selectOptions(choices, selected))
  }
  if (is.null(choicesOpt))
    choicesOpt <- list()
  l <- sapply(choices, length)
  if (!is.null(maxOptGroup))
    maxOptGroup <- rep_len(x = maxOptGroup, length.out = sum(l))
  m <- matrix(data = c(c(1, cumsum(l)[-length(l)] + 1), cumsum(l)), ncol = 2)
  html <- lapply(seq_along(choices), FUN = function(i) {
    label <- names(choices)[i]
    choice <- choices[[i]]
    if (is.list(choice)) {
      tags$optgroup(
        label = htmlEscape(label, TRUE),
        `data-max-options` = if (!is.null(maxOptGroup)) maxOptGroup[i],
        pickerSelectOptions(
          choice, selected,
          choicesOpt = lapply(
            X = choicesOpt,
            FUN = function(j) {
              j[m[i, 1]:m[i, 2]]
            }
          )
        )
      )
    } else {
      tags$option(
        value = choice,
        HTML(htmlEscape(label)),
        style = choicesOpt$style[i],
        class = choicesOpt$class[i],
        `data-icon` = choicesOpt$icon[i],
        `data-subtext` = choicesOpt$subtext[i],
        `data-content` = choicesOpt$content[i],
        `data-tokens` = choicesOpt$tokens[i],
        disabled = if (!is.null(choicesOpt$disabled[i]) && choicesOpt$disabled[i]) "disabled",
        selected = if (choice %in% selected) "selected" else NULL
      )
    }
  })
  return(tagList(html))
}

selectOptions <- function(choices, selected = NULL) {
  html <- mapply(choices, names(choices), FUN = function(choice, label) {
    if (is.list(choice)) {
      sprintf(
        '<optgroup label="%s">\n%s\n</optgroup>',
        htmlEscape(label, TRUE),
        selectOptions(choice, selected)
      )
      
    } else {
      sprintf(
        '<option value="%s"%s>%s</option>',
        htmlEscape(choice, TRUE),
        if (choice %in% selected) ' selected' else '',
        htmlEscape(label)
      )
    }
  })
  HTML(paste(html, collapse = '\n'))
}

label_input <- function(inputId, label) {
  tags$label(
    label,
    class = "control-label",
    class = if (is.null(label)) "shiny-label-null",
    id = paste0(inputId, "-label"),
    `for` = inputId
  )
}

html_dependency_picker_bs <- function(theme) {
  if (identical(bslib::theme_version(theme), "5")) {
    htmlDependency(
      name = "bootstrap-select",
      version = "1.14.0-3",
      package = "shinyWidgets",
      src = c(href = "shinyWidgets/bootstrap-select-1.14.0-beta2", file = "assets/bootstrap-select-1.14.0-beta2"),
      script = c("js/bootstrap-select.min.js"),
      stylesheet = c("css/bootstrap-select.min.css")
    )
  } else {
    htmlDependency(
      name = "bootstrap-select",
      version = "1.13.8",
      package = "shinyWidgets",
      src = c(href = "shinyWidgets/bootstrap-select", file = "assets/bootstrap-select"),
      script = c("js/bootstrap-select.min.js"),
      stylesheet = c("css/bootstrap-select.min.css")
    )
  }
}
html_dependency_picker <- function() {
  bslib::bs_dependency_defer(html_dependency_picker_bs)
}

pickerOptions <- function(actionsBox = NULL,
                          container = NULL,
                          countSelectedText = NULL,
                          deselectAllText = NULL,
                          dropdownAlignRight = NULL,
                          dropupAuto = NULL,
                          header = NULL,
                          hideDisabled = NULL,
                          iconBase = NULL,
                          liveSearch = NULL,
                          liveSearchNormalize = NULL,
                          liveSearchPlaceholder = NULL,
                          liveSearchStyle = NULL,
                          maxOptions = NULL,
                          maxOptionsText = NULL,
                          mobile = NULL,
                          multipleSeparator = NULL,
                          noneSelectedText = NULL,
                          noneResultsText = NULL,
                          selectAllText = NULL,
                          selectedTextFormat = NULL,
                          selectOnTab = NULL,
                          showContent = NULL,
                          showIcon = NULL,
                          showSubtext = NULL,
                          showTick = NULL,
                          size = NULL,
                          style = NULL,
                          tickIcon = NULL,
                          title = NULL,
                          virtualScroll = NULL,
                          width = NULL,
                          windowPadding = NULL,
                          ...) {
  params <- c(as.list(environment()), list(...))
  params <- dropNulls(params)
  names(params) <- convert_names(names(params))
  return(params)
}


convert_names <- function(x) {
  x <- gsub(pattern = "([A-Z])", replacement = "-\\1", x = x)
  tolower(x)
}



dropdown <- function(...,
                     style = "default",
                     status = "default",
                     size = "md",
                     icon = NULL,
                     label = NULL,
                     tooltip = FALSE,
                     right = FALSE,
                     up = FALSE,
                     width = NULL,
                     animate = FALSE,
                     inputId = NULL,
                     block = FALSE,
                     no_outline = TRUE) {
  
  
  if (is.null(inputId)) {
    inputId <- paste0("btn-", sample.int(1e9, 1))
  }
  dropId <- paste0("sw-drop-", inputId)
  contentId <- paste0("sw-content-", inputId)
  
  # Tooltip
  if (identical(tooltip, TRUE))
    tooltip <- tooltipOptions(title = label)
  has_tooltip <- !is.null(tooltip) && !identical(tooltip, FALSE)
  
  # Dropdown content
  dropcontent <- htmltools::tags$div(
    id = contentId,
    class = "sw-dropdown-content animated",
    class = if (up) "sw-dropup-content",
    class = if (right) "sw-dropright-content",
    style = htmltools::css(width = htmltools::validateCssUnit(width)),
    htmltools::tags$div(class = "sw-dropdown-in", ...)
  )
  # Button
  if (style == "default") {
    btn <- tags$button(
      class = paste0(
        "btn btn-", status," ",
        ifelse(size == "default" | size == "md", "", paste0("btn-", size))
      ),
      class = "action-button",
      type = "button", id = inputId, list(icon, label),
      htmltools::tags$span(
        class = ifelse(
          test = up,
          yes = "glyphicon glyphicon-triangle-top",
          no = "glyphicon glyphicon-triangle-bottom"
        )
      )
    )
  } else {
    btn <- actionBttn(
      inputId = inputId,
      label = label,
      icon = icon,
      style = style,
      color = status,
      size = size,
      block = block,
      no_outline = no_outline
    )
  }
  
  if (has_tooltip) {
    btn <- htmltools::tagAppendAttributes(
      btn,
      `data-bs-toggle` = "tooltip",
      `data-bs-title` = tooltip$title,
      `data-bs-placement` = tooltip$placement,
      `data-bs-html` = tolower(tooltip$html)
    )
  }
  
  # Final tag
  dropdownTag <- htmltools::tags$div(class = "sw-dropdown", id = dropId, btn, dropcontent)
  
  if (has_tooltip) {
    tooltip <- lapply(tooltip, function(x) {
      if (identical(x, TRUE))
        "true"
      else if (identical(x, FALSE))
        "false"
      else x
    })
    tooltipJs <- htmltools::tagFunction(function() {
      theme <- shiny::getCurrentTheme()
      if (!bslib::is_bs_theme(theme)) {
        return(dropdown_tooltip_bs3(inputId, tooltip))
      }
      if (bslib::theme_version(theme) %in% c("5")) {
        return(dropdown_tooltip_bs5(inputId, tooltip))
      }
      dropdown_tooltip_bs3(inputId, tooltip)
    })
    dropdownTag <- htmltools::tagAppendChild(dropdownTag, tooltipJs)
  }
  
  # Animate
  if (identical(animate, TRUE))
    animate <- animateOptions()
  
  if (!is.null(animate) && !identical(animate, FALSE)) {
    dropdownTag <- htmltools::tagAppendChild(
      dropdownTag, htmltools::tags$script(
        sprintf(
          "$(function() {swDrop('%s', '%s', '%s', '%s', '%s', '%s');});",
          inputId, contentId, dropId,
          animate$enter, animate$exit, as.character(animate$duration)
        )
      )
    )
    dropdownTag <- attachShinyWidgetsDep(dropdownTag, "animate")
  } else {
    dropdownTag <- htmltools::tagAppendChild(
      dropdownTag, htmltools::tags$script(
        sprintf(
          "$(function() {swDrop('%s', '%s', '%s', '%s', '%s', '%s');});",
          inputId, contentId, dropId, "sw-none", "sw-none", "1"
        )
      )
    )
  }
  
  attachShinyWidgetsDep(dropdownTag, "sw-dropdown")
}



dropdown_tooltip_bs3 <- function(inputId, tooltip) {
  htmltools::tags$script(
    sprintf(
      "$('#%s').tooltip({ placement: '%s', title: '%s', html: %s });",
      inputId, tooltip$placement, tooltip$title, tooltip$html
    )
  )
}

dropdown_tooltip_bs5 <- function(inputId, tooltip) {
  htmltools::tags$script(
    sprintf("const el = document.getElementById('%s');", inputId),
    "new bootstrap.Tooltip(el);"
  )
}




#' Animate options
animateOptions <- function(enter = "fadeInDown", exit = "fadeOutUp", duration = 1) {
  list(enter = enter, exit = exit, duration = duration)
}


actionBttn <- function(inputId,
                       label = NULL,
                       icon = NULL,
                       style = "unite",
                       color = "default",
                       size = "md",
                       block = FALSE,
                       no_outline = TRUE,
                       ...) {
  value <- shiny::restoreInput(id = inputId, default = NULL)
  style <- match.arg(
    arg = style,
    choices = c(
      "simple", "bordered", "minimal", "stretch", "jelly",
      "gradient", "fill", "material-circle", "material-flat",
      "pill", "float", "unite"
    )
  )
  color <- match.arg(
    arg = color,
    choices = c("default", "primary", "warning", "danger", "success", "royal")
  )
  size <- match.arg(arg = size, choices = c("xs", "sm", "md", "lg"))
  
  tagBttn <- tags$button(
    id = inputId,
    type = "button",
    class = "action-button bttn",
    `data-val` = value,
    class = paste0("bttn-", style),
    class = paste0("bttn-", size),
    class = paste0("bttn-", color),
    class = if (block) "bttn-block",
    class = if (no_outline) "bttn-no-outline",
    icon, label, ...
  )
  attachShinyWidgetsDep(tagBttn, "bttn")
}

html_dependency_bttn <- function() {
  htmlDependency(
    name = "bttn",
    version = "0.2.4",
    src = c(href = "shinyWidgets/bttn", file = "assets/bttn"),
    package = "shinyWidgets",
    stylesheet = "bttn.min.css"
  )
}


html_dependency_animate <- function() {
  htmlDependency(
    name = "animate",
    version = "3.5.2",
    package = "shinyWidgets",
    src = c(href = "shinyWidgets/animate", file = "assets/animate"),
    stylesheet = "animate.min.css"
  )
}