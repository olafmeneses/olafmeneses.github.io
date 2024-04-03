library(shiny)
fluidPage(
  titlePanel("LangNet"),
  
  # CSS style to position the overlay inputs and style the plot area and other custom scripts
  tags$head(
    HTML('<link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Noto+Sans+Display:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="style.css">
          <script src="scatterplotThree.js"></script>
          <script> window.onbeforeunload = function (e) { localStorage.clear(); };
                   window.onload = function(){$("#dropdown_bttn")[0].click()};</script>')
  ),
  
  # Main plot area
  div(id = "plot-container",
      scatterplotThreeOutput("distPlot", width = "100%", height = "100%"),
      dropdown(
        inputId = "dropdown_bttn",
        pickerInput("embedding",
                    label = "Dimensionality reduction method",
                    selected = "tsne",
                    choices = embedding_opts
        ),
        pickerInput("color_by_group",
                    label = "Color by group",
                    selected = "group1",
                    choices = group_opts
        ),
        pickerInput("filter_group",
                    label = "Filter by language family",
                    selected = filter_group_opts,
                    choices = filter_group_opts,
                    choicesOpt = list(subtext = counts_subtext),
                    multiple = T,
                    options = pickerOptions(liveSearch = T,
                                            liveSearchNormalize = T, actionsBox = T, noneSelectedText = "No families selected",
                                            liveSearchPlaceholder = "Search", selectedTextFormat = paste0("count > ", length(filter_group_opts) -1),
                                            countSelectedText = "All families selected")
        ),
        switchInput("edges", label = "Edges", value = T),
        
        style = "unite", icon = icon("gear"), size = "lg",
        status = "primary", width = "300px",
        animate = animateOptions(
          enter = animations$fading_entrances$fadeIn,
          exit = animations$fading_exits$fadeOut
        )
      )
  ),
  
  div(style = "position: absolute; bottom: 0; right: 0; margin: 12px; margin-right: 25px;",
      HTML('<a href="https://olafmeneses.github.io/" style="font-size:24px; text-decoration: none; color: white;">Made by Olaf Meneses</a>')
  )
)
