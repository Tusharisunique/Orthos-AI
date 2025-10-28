#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

#define MAX_PRODUCTS 1000
#define MAX_NAME_LENGTH 100
#define K 3  // 3D space (x, y, z)

// Global variable for dimension used in comparison
int dimension = 0;

// Structure to represent a product
typedef struct {
    char id[50];
    char name[MAX_NAME_LENGTH];
    double coordinates[K];  // x, y, z
} Product;

// Structure for KD-Tree node
typedef struct KDNode {
    Product product;
    struct KDNode *left, *right;
} KDNode;

// Global array to store products within radius
Product productsInRadius[MAX_PRODUCTS];
int productsInRadiusCount = 0;

// Function to create a new KD-Tree node
KDNode* createNode(Product product) {
    KDNode* node = (KDNode*)malloc(sizeof(KDNode));
    if (node == NULL) {
        fprintf(stderr, "Memory allocation failed\n");
        exit(1);
    }
    
    strcpy(node->product.id, product.id);
    strcpy(node->product.name, product.name);
    for (int i = 0; i < K; i++) {
        node->product.coordinates[i] = product.coordinates[i];
    }
    
    node->left = node->right = NULL;
    return node;
}

// Function to find the dimension with the highest variance
int findSplitDimension(Product products[], int n) {
    if (n <= 1) return 0;
    
    double sum[K] = {0};
    double sumSq[K] = {0};
    
    // Calculate sum and sum of squares for each dimension
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < K; j++) {
            sum[j] += products[i].coordinates[j];
            sumSq[j] += products[i].coordinates[j] * products[i].coordinates[j];
        }
    }
    
    // Calculate variance for each dimension
    double variance[K];
    for (int j = 0; j < K; j++) {
        variance[j] = sumSq[j] / n - (sum[j] / n) * (sum[j] / n);
    }
    
    // Find dimension with maximum variance
    int maxDim = 0;
    for (int j = 1; j < K; j++) {
        if (variance[j] > variance[maxDim]) {
            maxDim = j;
        }
    }
    
    return maxDim;
}

// Comparison function for qsort
int compareProducts(const void* a, const void* b, int dim) {
    const Product* p1 = (const Product*)a;
    const Product* p2 = (const Product*)b;
    
    if (p1->coordinates[dim] < p2->coordinates[dim]) return -1;
    if (p1->coordinates[dim] > p2->coordinates[dim]) return 1;
    return 0;
}

// Wrapper for qsort
int compareWrapper(const void* a, const void* b) {
    // Use the global dimension variable
    return compareProducts(a, b, dimension);
}

// Function to build KD-Tree
KDNode* buildKDTree(Product products[], int n, int depth) {
    if (n <= 0) return NULL;
    
    // Find the dimension to split on
    int dim = findSplitDimension(products, n);
    
    // Set the global variable for qsort comparison
    extern int dimension;
    dimension = dim;
    
    // Sort products based on the selected dimension
    qsort(products, n, sizeof(Product), compareWrapper);
    
    // Find median
    int median = n / 2;
    
    // Create node with median product
    KDNode* node = createNode(products[median]);
    
    // Recursively build left and right subtrees
    node->left = buildKDTree(products, median, depth + 1);
    node->right = buildKDTree(products + median + 1, n - median - 1, depth + 1);
    
    return node;
}

// Calculate squared distance between two points
double distanceSquared(double point1[], double point2[]) {
    double sum = 0;
    for (int i = 0; i < K; i++) {
        double diff = point1[i] - point2[i];
        sum += diff * diff;
    }
    return sum;
}

// Search for products within radius
void searchInRadius(KDNode* root, double queryPoint[], double radiusSquared, int depth) {
    if (root == NULL) return;
    
    // Calculate distance from query point to current node
    double dist = distanceSquared(queryPoint, root->product.coordinates);
    
    // If within radius, add to result
    if (dist <= radiusSquared && productsInRadiusCount < MAX_PRODUCTS) {
        productsInRadius[productsInRadiusCount++] = root->product;
    }
    
    // Determine which subtree to search first
    int dim = depth % K;
    KDNode *first = root->left, *second = root->right;
    
    if (queryPoint[dim] > root->product.coordinates[dim]) {
        first = root->right;
        second = root->left;
    }
    
    // Search the subtree that's more likely to contain points within radius
    searchInRadius(first, queryPoint, radiusSquared, depth + 1);
    
    // Check if we need to search the other subtree
    double dimDist = queryPoint[dim] - root->product.coordinates[dim];
    if (dimDist * dimDist <= radiusSquared) {
        searchInRadius(second, queryPoint, radiusSquared, depth + 1);
    }
}

// Function to read products from a file
int readProducts(const char* filename, Product products[]) {
    FILE* file = fopen(filename, "r");
    if (file == NULL) {
        fprintf(stderr, "Error opening file: %s\n", filename);
        return 0;
    }
    
    int count = 0;
    char line[512];
    
    // Skip header line
    fgets(line, sizeof(line), file);
    
    while (fgets(line, sizeof(line), file) && count < MAX_PRODUCTS) {
        char* token = strtok(line, ",");
        if (token == NULL) continue;
        
        strcpy(products[count].id, token);
        
        token = strtok(NULL, ",");
        if (token == NULL) continue;
        strcpy(products[count].name, token);
        
        for (int i = 0; i < K; i++) {
            token = strtok(NULL, ",");
            if (token == NULL) break;
            products[count].coordinates[i] = atof(token);
        }
        
        count++;
    }
    
    fclose(file);
    return count;
}

// Function to write results to a file
void writeResults(const char* filename, Product products[], int count) {
    FILE* file = fopen(filename, "w");
    if (file == NULL) {
        fprintf(stderr, "Error opening output file: %s\n", filename);
        return;
    }
    
    fprintf(file, "id,name,x,y,z\n");
    
    for (int i = 0; i < count; i++) {
        fprintf(file, "%s,%s,%.6f,%.6f,%.6f\n", 
                products[i].id, 
                products[i].name, 
                products[i].coordinates[0], 
                products[i].coordinates[1], 
                products[i].coordinates[2]);
    }
    
    fclose(file);
}

// Main function for testing
int main(int argc, char* argv[]) {
    if (argc < 4) {
        printf("Usage: %s <input_file> <output_file> <product_id> <radius>\n", argv[0]);
        return 1;
    }
    
    const char* inputFile = argv[1];
    const char* outputFile = argv[2];
    const char* targetId = argv[3];
    double radius = (argc > 4) ? atof(argv[4]) : 0.5;
    
    // Read products from file
    Product products[MAX_PRODUCTS];
    int productCount = readProducts(inputFile, products);
    
    if (productCount == 0) {
        fprintf(stderr, "No products found in input file\n");
        return 1;
    }
    
    // Build KD-Tree
    KDNode* root = buildKDTree(products, productCount, 0);
    
    // Find target product
    Product targetProduct;
    int targetFound = 0;
    
    for (int i = 0; i < productCount; i++) {
        if (strcmp(products[i].id, targetId) == 0) {
            targetProduct = products[i];
            targetFound = 1;
            break;
        }
    }
    
    if (!targetFound) {
        fprintf(stderr, "Target product ID not found\n");
        return 1;
    }
    
    // Search for products within radius
    productsInRadiusCount = 0;
    searchInRadius(root, targetProduct.coordinates, radius * radius, 0);
    
    // Write results to output file
    writeResults(outputFile, productsInRadius, productsInRadiusCount);
    
    printf("Found %d products within radius %.2f of product %s\n", 
           productsInRadiusCount, radius, targetProduct.name);
    
    return 0;
}