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
    int dim = depth % K;
    dimension = dim;  // Set global dimension for qsort
    
    // Sort products by the current dimension
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

// Function to calculate Euclidean distance between two points
double distance(double a[], double b[], int dim) {
    double sum = 0;
    for (int i = 0; i < dim; i++) {
        double diff = a[i] - b[i];
        sum += diff * diff;
    }
    return sqrt(sum);
}

// Function to find products within a given radius
void findProductsInRadius(KDNode* root, double point[], double radius, int depth) {
    if (root == NULL) return;
    
    // Calculate distance from point to current node
    double dist = distance(point, root->product.coordinates, K);
    
    // If within radius, add to result
    if (dist <= radius) {
        productsInRadius[productsInRadiusCount++] = root->product;
    }
    
    // Determine which side to search first
    int dim = depth % K;
    KDNode* first = root->left;
    KDNode* second = root->right;
    
    if (point[dim] > root->product.coordinates[dim]) {
        first = root->right;
        second = root->left;
    }
    
    // Search the side that point is on
    findProductsInRadius(first, point, radius, depth + 1);
    
    // Check if we need to search the other side
    double distToDim = fabs(point[dim] - root->product.coordinates[dim]);
    if (distToDim <= radius) {
        findProductsInRadius(second, point, radius, depth + 1);
    }
}

// Function to free KD-Tree memory
void freeKDTree(KDNode* root) {
    if (root == NULL) return;
    freeKDTree(root->left);
    freeKDTree(root->right);
    free(root);
}

// Main function
int main(int argc, char* argv[]) {
    if (argc != 5) {
        fprintf(stderr, "Usage: %s <input_file> <output_file> <target_id> <radius>\n", argv[0]);
        return 1;
    }
    
    char* inputFile = argv[1];
    char* outputFile = argv[2];
    char* targetId = argv[3];
    double radius = atof(argv[4]);
    
    // Read products from input file
    FILE* fin = fopen(inputFile, "r");
    if (fin == NULL) {
        fprintf(stderr, "Error opening input file: %s\n", inputFile);
        return 1;
    }
    
    // Skip header
    char line[1024];
    fgets(line, sizeof(line), fin);
    
    // Read products
    Product products[MAX_PRODUCTS];
    int productCount = 0;
    Product targetProduct;
    int targetFound = 0;
    
    while (fgets(line, sizeof(line), fin) && productCount < MAX_PRODUCTS) {
        char* token = strtok(line, ",");
        if (token == NULL) continue;
        
        strcpy(products[productCount].id, token);
        
        token = strtok(NULL, ",");
        if (token == NULL) continue;
        strcpy(products[productCount].name, token);
        
        for (int i = 0; i < K; i++) {
            token = strtok(NULL, ",");
            if (token == NULL) continue;
            products[productCount].coordinates[i] = atof(token);
        }
        
        // Check if this is the target product
        if (strcmp(products[productCount].id, targetId) == 0) {
            targetProduct = products[productCount];
            targetFound = 1;
        }
        
        productCount++;
    }
    
    fclose(fin);
    
    if (!targetFound) {
        fprintf(stderr, "Target product with ID %s not found\n", targetId);
        return 1;
    }
    
    // Build KD-Tree
    KDNode* root = buildKDTree(products, productCount, 0);
    
    // Find products within radius
    productsInRadiusCount = 0;
    findProductsInRadius(root, targetProduct.coordinates, radius, 0);
    
    // Write results to output file
    FILE* fout = fopen(outputFile, "w");
    if (fout == NULL) {
        fprintf(stderr, "Error opening output file: %s\n", outputFile);
        freeKDTree(root);
        return 1;
    }
    
    // Write header
    fprintf(fout, "id,name,x,y,z\n");
    
    // Write products within radius
    for (int i = 0; i < productsInRadiusCount; i++) {
        fprintf(fout, "%s,%s,%f,%f,%f\n",
                productsInRadius[i].id,
                productsInRadius[i].name,
                productsInRadius[i].coordinates[0],
                productsInRadius[i].coordinates[1],
                productsInRadius[i].coordinates[2]);
    }
    
    fclose(fout);
    freeKDTree(root);
    
    return 0;
}