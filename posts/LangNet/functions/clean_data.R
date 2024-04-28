remove_non_alphabetic <- function(text) {
  # Convert text to lowercase
  text <- tolower(text)
  # Remove non-alphabetic characters
  text <- stri_replace_all_regex(text, "[^[:alpha:]]", "")
  # Replace accented characters
  text <- stri_trans_general(text, "latin-ascii")
  return(text)
}

filter_lang <- function(df, filter) {
  df %>%
    filter(lang_id %in% (lang_df %>%
                           filter(eval(parse(text = filter))) %>%
                           pull(lang_id)))
}