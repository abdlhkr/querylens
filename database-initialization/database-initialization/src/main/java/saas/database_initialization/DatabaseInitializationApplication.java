package saas.database_initialization;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class DatabaseInitializationApplication {

	public static void main(String[] args) {
		SpringApplication.run(DatabaseInitializationApplication.class, args);
	}

}
