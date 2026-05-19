package com.proyecto.cursos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.proyecto.cursos.repository.UserRepository;

@SpringBootApplication
@EnableJpaRepositories("com.proyecto.cursos.repository")
@EntityScan("com.proyecto.cursos.model")
public class CursosApplication {

	public static void main(String[] args) {
		SpringApplication.run(CursosApplication.class, args);
	}

	@Bean
	public CommandLineRunner dataFixer(UserRepository userRepository) {
		return args -> {
			userRepository.findAll().forEach(user -> {
				boolean modified = false;
				if (user.getXp() == null) {
					user.setXp(0);
					modified = true;
				}
				if (user.getLevel() == null) {
					user.setLevel(1);
					modified = true;
				}
				if (modified) {
					userRepository.save(user);
				}
			});
		};
	}
}
