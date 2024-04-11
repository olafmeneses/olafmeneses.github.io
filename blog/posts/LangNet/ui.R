fluidPage(
  titlePanel("LangNet"),
  useShinyjs(),
  useWaiter(),
  waiterPreloader(html = div(
    style = "color:red;",
    img(src = "./images/LangNet_white.svg", width = "60%"),
    br(),br(),
    h3(style = "font-size: 30px; color: white;", "Exploring language families through numbers 1 to 10"),
    br(),br(),
    spin_wave()
  ),
  color = "black", fadeout = T),
  # CSS style to position the overlay inputs and style the plot area and other custom scripts
  tags$head(
    HTML('<link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Noto+Sans+Display:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="style.css">
          <script src="scatterplotThree.js"></script>
          <script> window.onbeforeunload = function (e) { localStorage.clear(); };};</script>')
  ),
  
  # Main plot area
  div(id = "plot-container",
      scatterplotThreeOutput("distPlot", width = "100%", height = "100%")
  ),
  div(style = "position: absolute; top: 0; right: 0; margin: 12px; margin-right: 25px;",
      actionButton("info_bttn", label = NULL, icon("info-circle"), class = "info-button")
  ),
  div(style = "position: absolute; top: 65px; right: 0; margin: 12px; margin-right: 25px;",
      dropdown(
        inputId = "dropdown_bttn",
        right=T,
        pickerInput("embedding",
                    label = list("Layout of points", bsButton("embedding-info", label = "", icon = icon("info", lib = "font-awesome"), style = "default", size = "extra-small")),
                    selected = "tsne",
                    choices = embedding_opts
        ),
        pickerInput("color_by_group",
                    label = "Color by family",
                    selected = "group1",
                    choices = group_opts
        ),
        pickerInput("filter_group",
                    label = "Filter by macrofamily",
                    selected = filter_group_opts,
                    choices = filter_group_opts,
                    choicesOpt = list(subtext = counts_subtext),
                    multiple = T,
                    options = pickerOptions(liveSearch = T, dropdownAlignRight = TRUE,
                                            liveSearchNormalize = T, actionsBox = T, noneSelectedText = "No families selected",
                                            liveSearchPlaceholder = "Search", selectedTextFormat = paste0("count > ", length(filter_group_opts) -1),
                                            countSelectedText = "All families selected")
        ),
        div(style = "text-align: right;",
            switchInput("edges", label = "Edges", value = T)
        ),
        style = "unite", icon = icon("gear"), size = "lg",
        status = "primary", width = "300px",
        animate = animateOptions(
          enter = animations$fading_entrances$fadeIn,
          exit = animations$fading_exits$fadeOut
        )
      )
  ),
  
  shinyBS::bsPopover(
    id = "embedding-info",
    title = "",
    content = HTML("Change between dimensionality reduction techniques"),
    placement = "left",
    trigger = "hover",
    options = list(container = "body")
  ),
  
  div(style = "position: absolute; bottom: 0; right: 0; margin: 12px; margin-right: 25px;",
      HTML('<a href="https://olafmeneses.github.io/" style="font-size:28px; text-decoration: none; color: white;">Made by Olaf Meneses</a>')
  ),
  
  
)
