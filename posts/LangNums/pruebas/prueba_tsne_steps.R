Rtsne_steps <- function(X, dims = 3, perplexity = 30, theta = 0.5, verbose = TRUE, iter_steps) {
  
  # Store the result matrices at each iteration
  result_matrices <- vector("list", 0)
  # Perform the iterations and store the result matrices
  for (i in 1:length(iter_steps)) {
    iter <- iter_steps[i]
    if (verbose) {
      cat("Running iteration", iter, "\n")
      flush.console()
    }
    res <- Rtsne:::Rtsne(X, dims = dims, perplexity = perplexity, theta = theta, max_iter = iter, verbose = FALSE, is_distance = T, pca = F)
    result_matrices[[i]] <- res$Y
  }
  
  # Return the list of result matrices
  return(result_matrices)
}

# Example usage
result_matrices <- Rtsne_steps(dist_matrix, dims = 3, perplexity = 50, iter_steps = c(1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 2500, 3000, 4000, 5000))

graphjs(g, vertex.size = 0.1, bg = "black", layout = result_matrices, fpl=500,
        vertex.label = sprintf("<h3 style='text-align:left;'>%s<br>%s<br>%s<br>%s</h3>",
                               V(g)$label, V(g)$group1, V(g)$group2, V(g)$group3)
)