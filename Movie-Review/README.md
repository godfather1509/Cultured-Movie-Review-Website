To Start a Java backend project follow these steps 

# Create Springboot Project

1. Visit Spring Initializr:
   * Go to `https://start.spring.io`
2. Select:
    * Project: Maven 
    * Language: Java
    * Sprinboot version: any LTS version
    * Packaging: JAR
    * Java version: same as on machine
3. Give name and group to the project as per choice 
4. Add dependencies:
    * Lombok (for reducing boilerplate)
    * Spring Web (for building REST APIs)
    * Spring Data MongoDB (for MongoDB integration)
    * Spring Boot DevTools (for hot reload during development)
5. Click “Generate” to download the .zip file.
6. Extract & Open:
    * Unzip the file.
    * Open the project folder in your preferred IDE.
7. Open terminal inside unzipped folder and run 
     
         ./mvnw spring-boot:run
    to start the website
8. By default it will open on `http://localhost:8080/`

# Creating Endpoint
There are many ways to create endpoint in Springboot

1. Add following lines of code
    
        import org.springframework.web.bind.annotation.GetMapping;
        import org.springframework.web.bind.annotation.RestController;

        @SpringBootApplication
        @RestController
        public class <FILE_NAME> {
            @GetMapping("/<URL_ENDPOINT>")
            public String <FUNCTION_NAME>(){
                return "Hello World";
            }
        }
This is simple endpoint 



# Setup .env file

To avoid uploading sensitive data like database passwords, API keys, or usernames to GitHub, we store such values in a `.env` file and exclude it from version control.

1. Ignore the `.env` File in Git
Add the `.env` to your `.gitignore` file. This ensures that the `.env` file is not uploaded to GitHub.

2. Enable Spring Boot to Read `.env` Files
Spring Boot does not support `.env` files by default, so we need to add an external dependency.

Steps:
- Go to `https://mvnrepository.com/`.
- Search for: `spring dotenv`
- Choose the one by `paulschwarz`
- Open the latest version, and copy the Maven dependency snippet.

        <dependency>
            <groupId>me.paulschwarz</groupId>
            <artifactId>spring-dotenv</artifactId>
            <version>2.3.0</version>
        </dependency>

**Note**: Replace `2.3.0` with the latest version at the time you're adding it.

- Paste the dependency into your `pom.xml`, just **before** the closing `</dependencies>` tag.

---

3. Create a `.env` File
Create a `.env` file in the root directory of your project, and add your sensitive info:

        env
        DB_USERNAME=myuser
        DB_PASSWORD=secret123

4. Use Environment Variables in `application.properties`
In your `application.properties`, use:

        spring.datasource.username=${DB_USERNAME}
        spring.datasource.password=${DB_PASSWORD}


# Configure Database

To configure database in springboot 
1. Open `aaplication.propertise` file in `src\main\resources\application.properties`.
2. In this file we write different application propertise that is related to this project.
3. For MongoDB database
        
        spring.data.mongodb.database=<MONGO_DATABASE_NAME>
        spring.data.mongodb.uri=<MONGO_CONNECTION_URI(Connection String)>
        
    For SQL database

        spring.datasource.url=jdbc:<DB_TYPE>://<HOST>:<PORT>/<DATABASE_NAME>
        spring.datasource.username=<USERNAME>
        spring.datasource.password=<PASSWORD>
        spring.datasource.driver-class-name=<DRIVER_CLASS_NAME>
        spring.jpa.hibernate.ddl-auto=update
        spring.jpa.show-sql=true